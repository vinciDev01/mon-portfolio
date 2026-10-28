import { Injectable, NotFoundException } from '@nestjs/common';
import type { CvVersion } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  ImageRun,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from 'docx';
import {
  avecBrouillon,
  ordonnerSections,
  sansMasquees,
  type CleSectionBase,
  type SectionBase,
  type SectionBrouillon,
} from './ordre-sections';
import { grouperTechnologies } from './technologies-cv';
import { choisir, langueCv, TEXTES, type LangueCv } from './langue-cv';
import { ligneCours, ligneExperience, posteDe, projetCv, suiteProjet, type ProjetCv } from './contenu-cv';
import {
  hrefDeLien,
  lignesContact,
  nomFichier,
  titrePoste,
  type LigneContact,
} from './en-tete';

/**
 * Rangs implicites des sections alimentees par la base, dans l'ordre ou un
 * recruteur lit un CV : qui (presentation), ce qu'il a fait (experiences),
 * ce qu'il sait faire (competences, technologies), ce qu'il a construit
 * (projets), puis ce qui le confirme (certifications, cours rediges).
 */
const RANG = {
  presentation: 10,
  experiences: 20,
  competences: 25,
  technologies: 30,
  projets: 40,
  certifications: 50,
  cours: 55,
} as const;

/** Mise en page, en points PostScript. 56 pt valent environ 2 cm. */
const MARGE = 56;
const CORPS = 10.5;
const TITRE_SECTION = 11;
const NOM = 20;
/** Le poste vise, sous le nom : plus petit que lui, plus grand que le corps. */
const POSTE = 12.5;
/** Les coordonnees, sur une ligne, un cran sous le corps. */
const CONTACT = 9.5;
const INTERLIGNE = 3;
/** Blanc avant un titre de section, en interlignes. */
const AVANT_SECTION = 1.1;
/** Largeur de la colonne des etiquettes (familles de technologies). */
const COLONNE_ETIQUETTE = 108;
/** Retrait des projets sous leur poste, et place de leur puce. */
const RETRAIT_PROJET = 16;
/** Cote du QR code du portfolio, en tete a droite (environ 2,3 cm). */
const QR = 66;
/** Blanc entre l'en-tete et le QR code. */
const ECART_QR = 14;

/** Largeur utile d'une page Word A4 (marges de 1120 twips), pour caler la
 *  periode a droite par une tabulation. */
const LARGEUR_WORD = 11906 - 2 * 1120;

const LIEN = '#1A0DAB';
const ENCRE = '#000000';
/** Gris du poste, des coordonnees et du filet : lisible, en retrait du nom. */
const GRIS = '#4A4A4A';
const FILET = '#9A9A9A';
/** Separateur des coordonnees, encodable en WinAnsi. */
const SEPARATEUR = '   |   ';

type Polices = { normal: string; gras: string };

/**
 * Le canevas est en serif ; le site, lui, est en sans-serif. Le choix se fait
 * depuis le backoffice (SiteSettings.cvFontFamily) plutot que d'etre fige ici.
 * On se limite aux polices de base du PDF, qui n'ont pas besoin d'etre
 * embarquees : le fichier reste leger et s'ouvre partout.
 */
function choisirPolices(reglage: string | undefined): Polices {
  return reglage === 'sans'
    ? { normal: 'Helvetica', gras: 'Helvetica-Bold' }
    : { normal: 'Times-Roman', gras: 'Times-Bold' };
}

/** Equivalent Word du meme reglage. Word n'a pas les polices de base du PDF. */
function policeWord(reglage: string | undefined): string {
  return reglage === 'sans' ? 'Arial' : 'Times New Roman';
}

/** Document produit : le contenu et le nom sous lequel il se telecharge. */
export type DocumentCv = { contenu: Buffer; nom: string };

@Injectable()
export class CvGeneratorService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Collecte unique, partagee par les deux rendus.
   *
   * C'est ce qui garantit que le PDF et le Word ne divergeront pas : ajouter
   * une rubrique ici la fait apparaitre dans les deux formats.
   */
  /**
   * La version demandee, s'il y en a une : elle fixe aussi la langue. Une
   * version inconnue est un 404, jamais le CV complet a sa place.
   */
  private async version(id: string | undefined): Promise<CvVersion | null> {
    if (!id) return null;
    const v = await this.prisma.cvVersion.findUnique({ where: { id } });
    if (!v) throw new NotFoundException(`Version du CV #${id} introuvable`);
    return v;
  }

  private async collecter(brouillon?: SectionBrouillon, langue: LangueCv = 'fr', version: CvVersion | null = null) {
    const t = TEXTES[langue];
    // Ce que la version retient ; une liste vide retient tout.
    const retenus = (ids: string[] | undefined) => (ids?.length ? new Set(ids) : null);
    const projetsRetenus = retenus(version?.projetIds);
    const competencesRetenues = retenus(version?.competenceIds);
    const [
      personalInfo,
      reglages,
      presentations,
      technologies,
      certifications,
      experiences,
      projets,
      sectionsLibres,
      competencesLibres,
      cours,
    ] = await Promise.all([
      this.prisma.personalInfo.findFirst(),
      this.prisma.siteSettings.findFirst(),
      this.prisma.presentation.findMany({ orderBy: { sortOrder: 'asc' } }),
      // Une technologie decochee « dans le CV » reste au portfolio seulement ;
      // une version qui choisit ses technologies les prend telles quelles.
      this.prisma.technology.findMany({
        where: version?.technologieIds.length ? { id: { in: version.technologieIds } } : { showInCv: true },
        orderBy: { sortOrder: 'asc' },
        include: { family: true },
      }),
      this.prisma.certification.findMany({
        include: { organization: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.experience.findMany({
        orderBy: { startDate: 'desc' },
        include: {
          projects: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
              cvSummary: true,
              descriptionEn: true,
              cvSummaryEn: true,
            },
          },
        },
      }),
      this.prisma.project.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.cvSection.findMany({ orderBy: { sortOrder: 'asc' } }),
      // Les competences sans technologie (management...) : les techniques
      // sont deja dans TECHNOLOGIES.
      this.prisma.skill.findMany({
        where: { technologyId: null },
        orderBy: { sortOrder: 'asc' },
        include: { family: true },
      }),
      this.prisma.cours.findMany({
        where: { publique: true },
        orderBy: [{ sortOrder: 'asc' }, { titre: 'asc' }],
        include: { technology: true },
      }),
    ]);

    const polices = choisirPolices(reglages?.cvFontFamily);
    const garderProjets = <P extends { id: string }>(liste: P[]) =>
      projetsRetenus ? liste.filter((p) => projetsRetenus.has(p.id)) : liste;

    // Sections alimentees par la base
    const base: (SectionBase & { cle: CleSectionBase })[] = [
      {
        cle: 'presentation' as const,
        titre: t.titres.presentation,
        rang: RANG.presentation,
        // Une breve presentation, en paragraphe : pas une liste.
        sansPuce: true,
        lignes: presentations
          .map((p) => choisir(p.description, p.descriptionEn, langue) ?? p.subtitle ?? p.title)
          // La presentation propre a la version remplace celle de la base.
          .filter(() => !version?.presentation)
          .concat(version?.presentation ? [version.presentation] : [])
          .filter((l): l is string => Boolean(l)),
      },
      (() => {
        // Une ligne par famille, en deux colonnes ; les lignes en texte
        // seul servent au filtre des sections vides et de repli.
        const paires = grouperTechnologies(
          technologies.map((x) => ({
            label: x.label,
            family: x.family ? { name: choisir(x.family.name, x.family.nameEn, langue), sortOrder: x.family.sortOrder } : null,
          })),
          t.autres,
        );
        return {
          cle: 'technologies' as const,
          titre: t.titres.technologies,
          rang: RANG.technologies,
          lignes: paires.map((p) => (p.etiquette ? `${p.etiquette}${t.deuxPoints}${p.valeur}` : p.valeur)),
          paires,
        };
      })(),
      {
        cle: 'certifications' as const,
        titre: t.titres.certifications,
        rang: RANG.certifications,
        lignes: certifications.map((c) => {
          const annee = c.issueDate ? new Date(c.issueDate).getFullYear() : null;
          const organisme = c.organization?.label ?? '';
          const suffixe = organisme ? ` - ${organisme}` : '';
          return `${annee ? `${annee}${t.deuxPoints}` : ''}${c.name}${suffixe}`;
        }),
      },
      {
        cle: 'experiences' as const,
        titre: t.titres.experiences,
        rang: RANG.experiences,
        // Ce qui y a ete fait et les projets menes, dans l'entree meme.
        lignes: experiences.map((e) =>
          // Chaque projet avec ce qu'il est, en quelques mots.
          ligneExperience(e, garderProjets(e.projects), langue),
        ),
        // La meme matiere structuree, que les deux rendus dessinent.
        postes: experiences.map((e) => posteDe(e, garderProjets(e.projects), langue)),
      },
      (() => {
        const paires = grouperTechnologies(
          competencesLibres
            .filter((s) => !competencesRetenues || competencesRetenues.has(s.id))
            .map((s) => ({
              label: choisir(s.label, s.labelEn, langue) ?? '',
              family: s.family ? { name: choisir(s.family.name, s.family.nameEn, langue), sortOrder: s.family.sortOrder } : null,
            }))
            .filter((s) => s.label),
          t.autres,
        );
        return {
          cle: 'competences' as const,
          titre: t.titres.competences,
          rang: RANG.competences,
          lignes: paires.map((p) => (p.etiquette ? `${p.etiquette}${t.deuxPoints}${p.valeur}` : p.valeur)),
          paires,
        };
      })(),
      {
        cle: 'projets' as const,
        titre: t.titres.projets,
        rang: RANG.projets,
        // Les projets d'une experience sont cites sous elle : ici, les autres
        // (personnels, independants), sans doublon.
        lignes: garderProjets(projets)
          .filter((p) => !p.experienceId)
          .map((p, i) => {
            const description = choisir(p.description, p.descriptionEn, langue);
            const detail = description ? `${t.deuxPoints}${description}` : '';
            return `${i + 1}. ${p.name}${detail}`;
          }),
        // En puces, comme sous un poste, avec la description entiere.
        projets: garderProjets(projets)
          .filter((p) => !p.experienceId)
          .map((p) => projetCv(p, true, langue)),
      },
      {
        cle: 'cours' as const,
        titre: t.titres.cours,
        rang: RANG.cours,
        lignes: cours.map((c) => ligneCours(c, langue)),
      },
    ];

    return {
      personalInfo,
      reglages,
      // Les sections de la base retirees du CV depuis le backoffice.
      sections: ordonnerSections(
        // Les sections masquees de la version, ou a defaut le reglage general.
        sansMasquees(base, version ? version.sectionsMasquees : (reglages?.cvBaseMasquees ?? [])),
        avecBrouillon(
          // Les sections libres dans la langue du CV, francais a defaut.
          sectionsLibres.map((x) => ({
            ...x,
            titre: choisir(x.titre, x.titreEn, langue),
            lignes: choisir(x.lignes, x.lignesEn, langue),
          })),
          brouillon,
        ),
      ),
      contact: lignesContact(
        personalInfo
          ? {
              nationalite: personalInfo.nationalite,
              adresse: personalInfo.adresse,
              adressePublique: personalInfo.adressePublique,
              phone: personalInfo.phone,
              email: personalInfo.email,
              githubUrl: personalInfo.githubUrl,
              linkedinUrl: personalInfo.linkedinUrl,
              portfolioUrl: reglages?.siteUrl,
            }
          : null,
        langue,
      ),
      // Le QR code du portfolio : seulement si l'adresse existe et que la
      // case est cochee au backoffice. Une image PNG, noir sur blanc.
      qr:
        reglages?.siteUrl?.trim() && reglages.cvAfficherQr
          ? await QRCode.toBuffer(reglages.siteUrl.trim(), {
              type: 'png',
              errorCorrectionLevel: 'M',
              margin: 1,
              width: 360,
              color: { dark: '#000000', light: '#ffffff' },
            })
          : null,
      titre: titrePoste(version?.titrePoste ?? choisir(reglages?.cvJobTitle, reglages?.cvJobTitleEn, langue)),
      langue,
      nomComplet: personalInfo
        ? `${personalInfo.name} ${personalInfo.surname}`.trim()
        : 'Curriculum Vitae',
      nom: personalInfo?.name ?? '',
      prenom: personalInfo?.surname ?? '',
    };
  }

  /** `brouillon` : la section du formulaire, pour l'apercu du backoffice. */
  /** `versionId` : une version du CV, dont la langue prime sur `langue`. */
  async generatePdf(brouillon?: SectionBrouillon, langue: LangueCv = 'fr', versionId?: string): Promise<DocumentCv> {
    const version = await this.version(versionId);
    if (version) langue = langueCv(version.langue);
    const { reglages, sections, contact, titre, nomComplet, nom, prenom, qr } =
      await this.collecter(brouillon, langue, version);
    const polices = choisirPolices(reglages?.cvFontFamily);

    const contenu = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: MARGE, size: 'A4' });
      const morceaux: Buffer[] = [];
      doc.on('data', (c: Buffer) => morceaux.push(c));
      doc.on('end', () => resolve(Buffer.concat(morceaux)));
      doc.on('error', reject);

      const largeur = doc.page.width - 2 * MARGE;

      // Un projet en puce : le nom en gras, puis ce qu'il est.
      const dessinerProjet = (projet: ProjetCv) => {
        doc.moveDown(0.2);
        const y = doc.y;
        const x = MARGE + RETRAIT_PROJET;
        const largeurProjet = largeur - RETRAIT_PROJET;
        doc.font(polices.normal).fontSize(CORPS).fillColor(ENCRE).text('•', MARGE + 4, y);
        doc
          .font(polices.gras)
          .fillColor(ENCRE)
          .text(projet.nom, x, y, { width: largeurProjet, lineGap: INTERLIGNE - 2, continued: Boolean(projet.resume) });
        if (projet.resume) doc.font(polices.normal).text(suiteProjet(projet.resume, langue));
      };

      // Le QR code du portfolio, en haut a droite : l'en-tete s'arrete avant
      // lui, pour ne jamais passer dessous.
      // Le temps de l'en-tete, la marge droite s'elargit de la place du QR
      // code : chaque texte, coordonnees comprises, s'arrete avant lui.
      const hautEntete = doc.y;
      if (qr) {
        doc.image(qr, MARGE + largeur - QR, hautEntete, { width: QR, height: QR });
        doc.page.margins.right = MARGE + QR + ECART_QR;
      }

      // En-tete : le nom, le poste vise, puis les coordonnees sur une ligne.
      doc.font(polices.gras).fontSize(NOM).fillColor(ENCRE).text(nomComplet, MARGE, hautEntete);
      // Le poste vise, sous le nom : c'est la premiere chose que lit un
      // recruteur apres le nom.
      if (titre) {
        doc.moveDown(0.1);
        doc.font(polices.normal).fontSize(POSTE).fillColor(GRIS).text(titre);
      }

      if (contact.length) {
        doc.moveDown(0.35);
        doc.font(polices.normal).fontSize(CONTACT).fillColor(GRIS);
        // Une seule ligne, coupee la ou il faut : chaque morceau est un
        // `text` continu, les liens gardent leur adresse.
        contact.forEach((l, i) => {
          const dernier = i === contact.length - 1;
          const suite = { continued: !dernier };
          if (l.genre === 'texte') {
            doc.fillColor(GRIS).text(l.texte + (dernier ? '' : SEPARATEUR), suite);
          } else {
            doc.fillColor(GRIS).text(l.etiquette, { continued: true });
            // Dernier morceau : le lien clot la ligne lui-meme. Un `text('')`
            // final serait ignore par PDFKit et laisserait la ligne ouverte,
            // collant le titre de section suivant aux coordonnees.
            doc.fillColor(LIEN).text(l.url, { link: hrefDeLien(l.url), underline: true, ...suite });
            // Le separateur, hors du lien : sinon le soulignement le suit.
            if (!dernier) {
              doc.fillColor(GRIS).text(SEPARATEUR, { link: null, underline: false, continued: true });
            }
          }
        });
      }

      // Fin de l'en-tete : la marge reprend sa place, et la suite part sous
      // le QR code s'il descend plus bas que le texte.
      if (qr) {
        doc.page.margins.right = MARGE;
        doc.y = Math.max(doc.y, hautEntete + QR);
      }

      // Sections
      for (const section of sections) {
        doc.moveDown(AVANT_SECTION);
        doc
          .font(polices.gras)
          .fontSize(TITRE_SECTION)
          .fillColor(ENCRE)
          // toUpperCase() preserve les accents ('é' -> 'É'), et normalise ce
          // qui est saisi au backoffice sans imposer la saisie en capitales.
          .text(section.titre.toUpperCase(), { characterSpacing: 0.6 });
        // Un filet fin sous le titre, sur toute la largeur : il separe les
        // sections sans les encadrer.
        const yFilet = doc.y + 2;
        doc
          .moveTo(MARGE, yFilet)
          .lineTo(MARGE + largeur, yFilet)
          .lineWidth(0.5)
          .strokeColor(FILET)
          .stroke();
        doc.y = yFilet + 5;

        if (section.postes?.length) {
          section.postes.forEach((poste, i) => {
            if (i > 0) doc.moveDown(0.7);
            // L'en-tete : intitule en gras et employeur a gauche, periode en
            // gris calee a droite, sur la meme ligne. La colonne de gauche
            // s'arrete avant la periode pour ne jamais la chevaucher.
            const y = doc.y;
            doc.font(polices.normal).fontSize(CORPS);
            const largeurPeriode = doc.widthOfString(poste.periode);
            doc.fillColor(GRIS).text(poste.periode, MARGE, y, { width: largeur, align: 'right' });
            const basPeriode = doc.y;
            doc
              .font(polices.gras)
              .fillColor(ENCRE)
              .text(poste.intitule, MARGE, y, { width: largeur - largeurPeriode - 12, continued: true })
              .font(polices.normal)
              .text(`, ${poste.employeur}`);
            doc.y = Math.max(doc.y, basPeriode);
            if (poste.description) {
              doc.moveDown(0.15);
              doc.font(polices.normal).fontSize(CORPS).fillColor(ENCRE).text(poste.description, MARGE, doc.y, {
                width: largeur,
                lineGap: INTERLIGNE - 2,
              });
            }
            for (const projet of poste.projets) dessinerProjet(projet);
          });
          doc.x = MARGE;
          continue;
        }

        if (section.projets?.length) {
          section.projets.forEach((projet, i) => {
            if (i > 0) doc.moveDown(0.15);
            dessinerProjet(projet);
          });
          doc.x = MARGE;
          continue;
        }

        if (section.paires?.length) {
          // Deux colonnes : l'etiquette en gras, sa valeur a droite. La ligne
          // suivante part sous la plus haute des deux.
          for (const p of section.paires) {
            const y = doc.y;
            if (p.etiquette === null) {
              doc.font(polices.normal).fontSize(CORPS).fillColor(ENCRE).text(p.valeur, MARGE, y, { width: largeur });
              continue;
            }
            doc.font(polices.gras).fontSize(CORPS).fillColor(ENCRE).text(p.etiquette, MARGE, y, {
              width: COLONNE_ETIQUETTE - 8,
            });
            const basEtiquette = doc.y;
            doc.font(polices.normal).text(p.valeur, MARGE + COLONNE_ETIQUETTE, y, {
              width: largeur - COLONNE_ETIQUETTE,
              lineGap: INTERLIGNE - 2,
            });
            doc.y = Math.max(doc.y, basEtiquette) + 2;
          }
          doc.x = MARGE;
          continue;
        }

        for (const entree of section.lignes) {
          // Les entrees deja numerotees (« 1. … ») gardent leur numero ;
          // les autres recoivent une puce. Le canevas d'origine affiche un
          // carre, mais c'est un glyphe Wingdings que les lecteurs PDF ne
          // resolvent pas : on utilise une puce encodable en WinAnsi.
          const numerotee = /^\d+\.\s/.test(entree);
          doc
            .font(polices.normal)
            .fontSize(CORPS)
            .fillColor(ENCRE)
            .text(numerotee || section.sansPuce ? entree : `• ${entree}`, MARGE, doc.y, {
              width: largeur,
              lineGap: INTERLIGNE - 2,
            });
        }
      }

      doc.end();
    });

    return { contenu, nom: nomFichier(nom, prenom, 'pdf', langue) };
  }

  /**
   * Meme structure que le PDF, rendue en Word.
   *
   * On s'appuie sur les vrais styles du document (Title, Heading 1, Normal)
   * plutot que sur du formatage direct : c'est ce qui permet au destinataire
   * de restyler le CV d'un clic, fait fonctionner le volet de navigation, et
   * garde le fichier reellement modifiable.
   */
  async generateDocx(langue: LangueCv = 'fr', versionId?: string): Promise<DocumentCv> {
    const version = await this.version(versionId);
    if (version) langue = langueCv(version.langue);
    const { reglages, sections, contact, titre, nomComplet, nom, prenom, qr } =
      await this.collecter(undefined, langue, version);
    const police = policeWord(reglages?.cvFontFamily);

    // Gris du poste et des coordonnees, comme dans le PDF.
    const gris = GRIS.slice(1);
    const morceauxDeContact = (l: LigneContact, dernier: boolean) => [
      ...(l.genre === 'texte'
        ? [new TextRun({ text: l.texte, color: gris, size: 19 })]
        : [
            new TextRun({ text: l.etiquette, color: gris, size: 19 }),
            new ExternalHyperlink({
              link: hrefDeLien(l.url),
              children: [new TextRun({ text: l.url, style: 'Hyperlink', size: 19 })],
            }),
          ]),
      ...(dernier ? [] : [new TextRun({ text: SEPARATEUR, color: gris, size: 19 })]),
    ];

    // Un projet en puce Word : le nom en gras, puis ce qu'il est.
    const paragrapheProjet = (projet: ProjetCv) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: projet.nom, bold: true }),
          ...(projet.resume ? [new TextRun({ text: suiteProjet(projet.resume, langue) })] : []),
        ],
      });

    const corps: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [
          // Le QR code du portfolio, flottant en haut a droite : le nom, le
          // poste et les coordonnees le contournent. Word compte en pixels
          // (96 par pouce), le PDF en points (72) : meme taille imprimee.
          ...(qr
            ? [
                new ImageRun({
                  type: 'png',
                  data: qr,
                  transformation: { width: Math.round((QR * 96) / 72), height: Math.round((QR * 96) / 72) },
                  floating: {
                    horizontalPosition: {
                      relative: HorizontalPositionRelativeFrom.MARGIN,
                      align: HorizontalPositionAlign.RIGHT,
                    },
                    verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
                    wrap: { type: TextWrappingType.SQUARE },
                  },
                }),
              ]
            : []),
          new TextRun(nomComplet),
        ],
      }),
      ...(titre
        ? [
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: titre, size: 25, color: gris })],
            }),
          ]
        : []),
      // Les coordonnees sur une ligne, comme dans le PDF.
      ...(contact.length
        ? [
            new Paragraph({
              spacing: { after: 0 },
              children: contact.flatMap((l, i) => morceauxDeContact(l, i === contact.length - 1)),
            }),
          ]
        : []),
    ];

    for (const section of sections) {
      corps.push(
        new Paragraph({
          text: section.titre.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
        }),
      );
      if (section.postes?.length) {
        for (const poste of section.postes) {
          // L'en-tete : intitule et employeur, periode calee a droite par
          // une vraie tabulation, que le destinataire peut deplacer.
          corps.push(
            new Paragraph({
              spacing: { before: 120, after: 20 },
              keepNext: true,
              tabStops: [{ type: TabStopType.RIGHT, position: LARGEUR_WORD }],
              children: [
                new TextRun({ text: poste.intitule, bold: true }),
                new TextRun({ text: `, ${poste.employeur}` }),
                new TextRun({ children: [new Tab(), poste.periode], color: gris }),
              ],
            }),
          );
          if (poste.description) {
            corps.push(new Paragraph({ text: poste.description, spacing: { after: 40 } }));
          }
          for (const projet of poste.projets) corps.push(paragrapheProjet(projet));
        }
        continue;
      }
      if (section.projets?.length) {
        for (const projet of section.projets) corps.push(paragrapheProjet(projet));
        continue;
      }
      if (section.paires?.length) {
        // Deux colonnes par une tabulation : l'etiquette en gras, sa valeur
        // alignee a droite d'elle. Une vraie tabulation, pas des espaces :
        // le destinataire peut la deplacer.
        for (const p of section.paires) {
          corps.push(
            new Paragraph({
              spacing: { after: 20 },
              tabStops: [{ type: TabStopType.LEFT, position: COLONNE_ETIQUETTE * 20 }],
              children: p.etiquette
                ? [new TextRun({ text: p.etiquette, bold: true }), new TextRun({ children: [new Tab(), p.valeur] })]
                : [new TextRun(p.valeur)],
            }),
          );
        }
        continue;
      }
      for (const entree of section.lignes) {
        // Les entrees deja numerotees gardent leur numero ; les autres
        // recoivent une puce Word, qui reste une vraie liste a puces.
        const numerotee = /^\d+\.\s/.test(entree);
        corps.push(
          new Paragraph({
            text: entree,
            spacing: { after: 0 },
            ...(numerotee || section.sansPuce ? {} : { bullet: { level: 0 } }),
          }),
        );
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: police, size: 21 }, // 21 demi-points = 10,5 pt
            paragraph: { spacing: { after: 60 } },
          },
          title: {
            run: { font: police, size: NOM * 2, bold: true, color: '000000' },
            paragraph: { spacing: { after: 40 }, alignment: AlignmentType.LEFT },
          },
          // Le titre de section porte son filet, comme dans le PDF : une
          // bordure de paragraphe, que le destinataire peut restyler.
          heading1: {
            run: { font: police, size: 22, bold: true, color: '000000', characterSpacing: 12 },
            paragraph: {
              spacing: { before: 280, after: 100 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: FILET.slice(1), space: 2 } },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: { margin: { top: 1120, bottom: 1120, left: 1120, right: 1120 } },
          },
          children: corps,
        },
      ],
    });

    const contenu = await Packer.toBuffer(doc);
    return { contenu: Buffer.from(contenu), nom: nomFichier(nom, prenom, 'docx', langue) };
  }
}
