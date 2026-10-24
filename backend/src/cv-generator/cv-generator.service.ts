import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
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
import {
  hrefDeLien,
  lignesContact,
  nomFichier,
  titrePoste,
  type LigneContact,
} from './en-tete';

/** Rangs implicites des sections alimentees par la base. */
const RANG = {
  presentation: 10,
  technologies: 30,
  certifications: 40,
  experiences: 50,
  projets: 60,
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

/** « Juillet 2025 ». */
function moisAnnee(date: Date | null | undefined): string {
  if (!date) return '';
  const s = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

@Injectable()
export class CvGeneratorService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Collecte unique, partagee par les deux rendus.
   *
   * C'est ce qui garantit que le PDF et le Word ne divergeront pas : ajouter
   * une rubrique ici la fait apparaitre dans les deux formats.
   */
  private async collecter(brouillon?: SectionBrouillon) {
    const [
      personalInfo,
      reglages,
      presentations,
      technologies,
      certifications,
      experiences,
      projets,
      sectionsLibres,
    ] = await Promise.all([
      this.prisma.personalInfo.findFirst(),
      this.prisma.siteSettings.findFirst(),
      this.prisma.presentation.findMany({ orderBy: { sortOrder: 'asc' } }),
      // Une technologie decochee « dans le CV » reste au portfolio seulement.
      this.prisma.technology.findMany({
        where: { showInCv: true },
        orderBy: { sortOrder: 'asc' },
        include: { family: true },
      }),
      this.prisma.certification.findMany({
        include: { organization: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.experience.findMany({ orderBy: { startDate: 'desc' } }),
      this.prisma.project.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.cvSection.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    const polices = choisirPolices(reglages?.cvFontFamily);

    // Sections alimentees par la base
    const base: (SectionBase & { cle: CleSectionBase })[] = [
      {
        cle: 'presentation' as const,
        titre: 'PRÉSENTATION',
        rang: RANG.presentation,
        lignes: presentations
          .map((p) => p.description ?? p.subtitle ?? p.title)
          .filter((l): l is string => Boolean(l)),
      },
      (() => {
        // Une ligne par famille, en deux colonnes ; les lignes en texte
        // seul servent au filtre des sections vides et de repli.
        const paires = grouperTechnologies(technologies);
        return {
          cle: 'technologies' as const,
          titre: 'TECHNOLOGIES',
          rang: RANG.technologies,
          lignes: paires.map((p) => (p.etiquette ? `${p.etiquette} : ${p.valeur}` : p.valeur)),
          paires,
        };
      })(),
      {
        cle: 'certifications' as const,
        titre: 'CERTIFICATIONS',
        rang: RANG.certifications,
        lignes: certifications.map((c) => {
          const annee = c.issueDate ? new Date(c.issueDate).getFullYear() : null;
          const organisme = c.organization?.label ?? '';
          const suffixe = organisme ? ` - ${organisme}` : '';
          return `${annee ? `${annee} : ` : ''}${c.name}${suffixe}`;
        }),
      },
      {
        cle: 'experiences' as const,
        titre: 'EXPÉRIENCES PROFESSIONNELLES',
        rang: RANG.experiences,
        lignes: experiences.map((e) => {
          const debut = moisAnnee(e.startDate);
          const fin = e.isCurrent ? "aujourd'hui" : moisAnnee(e.endDate);
          const periode = [debut, fin].filter(Boolean).join(' à ');
          return `${periode ? `${periode} : ` : ''}${e.role} à ${e.company}`;
        }),
      },
      {
        cle: 'projets' as const,
        titre: 'PROJETS RÉALISÉS',
        rang: RANG.projets,
        lignes: projets.map((p, i) => {
          const detail = p.description ? ` : ${p.description}` : '';
          return `${i + 1}. ${p.name}${detail}`;
        }),
      },
    ];

    return {
      personalInfo,
      reglages,
      // Les sections de la base retirees du CV depuis le backoffice.
      sections: ordonnerSections(
        sansMasquees(base, reglages?.cvBaseMasquees ?? []),
        avecBrouillon(sectionsLibres, brouillon),
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
            }
          : null,
      ),
      titre: titrePoste(reglages?.cvJobTitle),
      nomComplet: personalInfo
        ? `${personalInfo.name} ${personalInfo.surname}`.trim()
        : 'Curriculum Vitae',
      nom: personalInfo?.name ?? '',
      prenom: personalInfo?.surname ?? '',
    };
  }

  /** `brouillon` : la section du formulaire, pour l'apercu du backoffice. */
  async generatePdf(brouillon?: SectionBrouillon): Promise<DocumentCv> {
    const { reglages, sections, contact, titre, nomComplet, nom, prenom } =
      await this.collecter(brouillon);
    const polices = choisirPolices(reglages?.cvFontFamily);

    const contenu = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: MARGE, size: 'A4' });
      const morceaux: Buffer[] = [];
      doc.on('data', (c: Buffer) => morceaux.push(c));
      doc.on('end', () => resolve(Buffer.concat(morceaux)));
      doc.on('error', reject);

      const largeur = doc.page.width - 2 * MARGE;

      // En-tete : le nom, le poste vise, puis les coordonnees sur une ligne.
      doc.font(polices.gras).fontSize(NOM).fillColor(ENCRE).text(nomComplet);
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
            .text(numerotee ? entree : `• ${entree}`, MARGE, doc.y, {
              width: largeur,
              lineGap: INTERLIGNE - 2,
            });
        }
      }

      doc.end();
    });

    return { contenu, nom: nomFichier(nom, prenom, 'pdf') };
  }

  /**
   * Meme structure que le PDF, rendue en Word.
   *
   * On s'appuie sur les vrais styles du document (Title, Heading 1, Normal)
   * plutot que sur du formatage direct : c'est ce qui permet au destinataire
   * de restyler le CV d'un clic, fait fonctionner le volet de navigation, et
   * garde le fichier reellement modifiable.
   */
  async generateDocx(): Promise<DocumentCv> {
    const { reglages, sections, contact, titre, nomComplet, nom, prenom } =
      await this.collecter();
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

    const corps: Paragraph[] = [
      new Paragraph({ text: nomComplet, heading: HeadingLevel.TITLE }),
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
            ...(numerotee ? {} : { bullet: { level: 0 } }),
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
    return { contenu: Buffer.from(contenu), nom: nomFichier(nom, prenom, 'docx') };
  }
}
