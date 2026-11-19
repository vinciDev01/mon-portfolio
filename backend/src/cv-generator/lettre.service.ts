import { Injectable, NotFoundException } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  AlignmentType,
  Document,
  LineRuleType,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { PrismaService } from '../prisma/prisma.service';
import type { DocumentCv } from './cv-generator.service';
import { langueCv, TEXTES, type LangueCv } from './langue-cv';
import {
  aUnCorps,
  enTeteParDefaut,
  ligneLieuDate,
  ligneObjet,
  lignesDe,
  MISES_EN_PAGE,
  nomFichierLettre,
  sectionsLettre,
  type MiseEnPage,
  type SectionLettre,
} from './lettre';

/** Les tailles de reference, pour un corps de 11 points ; une mise en page
 *  plus serree les reduit toutes dans la meme proportion. */
const CORPS_REFERENCE = 11;
const EN_TETE = 10;
const NOM = 12.5;
const INTERLIGNE = 2;
const APRES_PARAGRAPHE = 9;
/** Blanc laisse au-dessus du nom pour signer a la main. */
const ESPACE_SIGNATURE = 36;
const ENCRE = '#000000';
/** Le bloc de droite (destinataire, lieu et date, signature) prend au plus
 *  cette part de la largeur utile ; une ligne plus longue passe a la ligne. */
const BLOC_DROIT_MAX = 0.5;
/** La page A4, en points. */
const A4 = { largeur: 595.28, hauteur: 841.89 };

/** Les polices de base du PDF, selon le reglage du CV : la lettre et le CV
 *  envoyes ensemble se ressemblent. */
function polices(reglage: string | undefined) {
  return reglage === 'sans'
    ? { normal: 'Helvetica', gras: 'Helvetica-Bold', word: 'Arial' }
    : { normal: 'Times-Roman', gras: 'Times-Bold', word: 'Times New Roman' };
}

/** Ce qu'une lettre contient, enregistree dans une version ou en cours de
 *  saisie dans l'apercu. */
export type DonneesLettre = {
  langue: string;
  destinataire: string | null;
  lieu: string | null;
  date: Date | null;
  objet: string | null;
  /** La colonne JSON ou la saisie : `[{ titre, corps }]`. */
  sections: unknown;
  /** Un en-tete en cours de saisie ; absent : celui des reglages. */
  enTete?: string | null;
};

type Lettre = {
  langue: LangueCv;
  polices: ReturnType<typeof polices>;
  enTete: string[];
  destinataire: string[];
  lieuDate: string;
  objet: string | null;
  sections: SectionLettre[];
  nomComplet: string;
  nom: string;
  prenom: string;
};

/** Les tailles d'une mise en page, toutes proportionnelles au corps. */
function tailles(mise: MiseEnPage) {
  const k = mise.corps / CORPS_REFERENCE;
  return {
    corps: mise.corps,
    enTete: EN_TETE * k,
    nom: NOM * k,
    interligne: INTERLIGNE * k,
    apresParagraphe: APRES_PARAGRAPHE * k,
    signature: ESPACE_SIGNATURE * k,
  };
}

/**
 * La largeur du bloc de droite : celle de sa plus longue ligne, pour que
 * cette ligne finisse sur la marge de droite, les autres alignees a gauche
 * sur elle. Mesuree dans la police et la taille du corps, et bornee a la
 * moitie de la page.
 */
function largeurBlocDroit(
  doc: PDFKit.PDFDocument,
  l: Lettre,
  corps: number,
  largeur: number,
): number {
  doc.font(l.polices.normal).fontSize(corps);
  const lignes = [...l.destinataire, l.lieuDate, l.nomComplet];
  // Un point de jeu : PDFKit coupe une ligne qui tient tout juste.
  const plusLongue = Math.max(...lignes.map((x) => doc.widthOfString(x))) + 1;
  return Math.min(plusLongue, largeur * BLOC_DROIT_MAX);
}

/** Un PDF de la lettre, avec le nombre de pages, pour signaler a l'apercu
 *  une lettre trop longue meme une fois resserree. */
export type PdfLettre = DocumentCv & { pages: number; mise: MiseEnPage };

/**
 * La lettre de motivation d'une version du CV, en PDF ou en Word : l'en-tete
 * commun (reglages du site, ou a defaut les informations personnelles), puis
 * le destinataire, le lieu et la date, l'objet, les sections du corps et le
 * nom en signature. La taille s'ajuste pour tenir sur une page. Reservee au
 * backoffice.
 */
@Injectable()
export class LettreService {
  constructor(private readonly prisma: PrismaService) {}

  private async depuisVersion(versionId: string): Promise<DonneesLettre> {
    const version = await this.prisma.cvVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) {
      throw new NotFoundException(`Version du CV #${versionId} introuvable`);
    }
    return {
      langue: version.langue,
      destinataire: version.lettreDestinataire,
      lieu: version.lettreLieu,
      date: version.lettreDate,
      objet: version.lettreObjet,
      sections: version.lettreSections,
    };
  }

  private async preparer(d: DonneesLettre): Promise<Lettre> {
    const sections = sectionsLettre(d.sections);
    if (!aUnCorps(sections)) {
      throw new NotFoundException("Cette version n'a pas de lettre");
    }
    const [reglages, info] = await Promise.all([
      this.prisma.siteSettings.findFirst(),
      this.prisma.personalInfo.findFirst(),
    ]);
    const langue = langueCv(d.langue);
    const nomComplet = info ? `${info.name} ${info.surname}`.trim() : '';
    const enTete =
      d.enTete !== undefined && d.enTete !== null && d.enTete.trim()
        ? d.enTete
        : (reglages?.lettreEnTete ?? enTeteParDefaut(info, reglages?.siteUrl));
    return {
      langue,
      polices: polices(reglages?.cvFontFamily),
      enTete: lignesDe(enTete),
      destinataire: lignesDe(d.destinataire),
      lieuDate: ligneLieuDate(d.lieu, d.date, langue),
      objet: ligneObjet(d.objet, langue),
      sections,
      nomComplet,
      nom: info?.name ?? '',
      prenom: info?.surname ?? '',
    };
  }

  /** Dessine la lettre ; rend l'ordonnee atteinte sous la signature. */
  private dessiner(doc: PDFKit.PDFDocument, l: Lettre, mise: MiseEnPage) {
    const t = tailles(mise);
    const largeur = doc.page.width - 2 * mise.marge;
    const largeurDestinataire = largeurBlocDroit(doc, l, t.corps, largeur);
    const xDestinataire = mise.marge + largeur - largeurDestinataire;
    doc.fillColor(ENCRE);

    // L'en-tete, en haut a gauche : la premiere ligne (le nom) en gras.
    l.enTete.forEach((ligne, i) => {
      doc
        .font(i === 0 ? l.polices.gras : l.polices.normal)
        .fontSize(i === 0 ? t.nom : t.enTete)
        .text(ligne, mise.marge, doc.y, { width: largeur });
    });

    // Le destinataire, a partir de la mi-page.
    doc.font(l.polices.normal).fontSize(t.corps);
    doc.moveDown(1.5);
    for (const ligne of l.destinataire) {
      doc.text(ligne, xDestinataire, doc.y, { width: largeurDestinataire });
    }
    doc.moveDown(1.2);
    doc.text(l.lieuDate, xDestinataire, doc.y, { width: largeurDestinataire });

    if (l.objet) {
      doc.moveDown(1.5);
      doc
        .font(l.polices.gras)
        .text(l.objet, mise.marge, doc.y, { width: largeur });
      doc.font(l.polices.normal);
    }

    doc.moveDown(1.2);
    for (const s of l.sections) {
      if (s.titre) {
        doc.font(l.polices.gras).text(s.titre, mise.marge, doc.y, {
          width: largeur,
          paragraphGap: t.interligne * 1.5,
        });
        doc.font(l.polices.normal);
      }
      for (const p of s.paragraphes) {
        doc.text(p, mise.marge, doc.y, {
          width: largeur,
          align: 'justify',
          lineGap: t.interligne,
          paragraphGap: t.apresParagraphe,
        });
      }
    }

    // Le nom, a droite, sous un blanc pour signer.
    doc.y += t.signature;
    doc.text(l.nomComplet, xDestinataire, doc.y, {
      width: largeurDestinataire,
    });
    return doc.y;
  }

  /**
   * La mise en page la plus confortable qui tient sur une page A4 : chacune
   * est essayee sur une page tres haute, ou rien ne passe a la page suivante,
   * et l'ordonnee finale dit si la lettre aurait tenu.
   */
  private choisirMise(l: Lettre): MiseEnPage {
    for (const mise of MISES_EN_PAGE) {
      const essai = new PDFDocument({
        size: [A4.largeur, 100_000],
        margin: mise.marge,
      });
      const bas = this.dessiner(essai, l, mise);
      essai.end();
      if (bas <= A4.hauteur - mise.marge) return mise;
    }
    return MISES_EN_PAGE[MISES_EN_PAGE.length - 1];
  }

  private rendrePdf(l: Lettre): Promise<PdfLettre> {
    const mise = this.choisirMise(l);
    return new Promise<PdfLettre>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: mise.marge,
        size: 'A4',
        lang: TEXTES[l.langue].locale,
        displayTitle: true,
        info: {
          Title: `${l.langue === 'en' ? 'Cover letter' : 'Lettre de motivation'} - ${l.nomComplet}`,
          Author: l.nomComplet,
          Subject: l.objet ?? '',
        },
      });
      let pages = 1;
      const morceaux: Buffer[] = [];
      doc.on('pageAdded', () => (pages += 1));
      doc.on('data', (c: Buffer) => morceaux.push(c));
      doc.on('end', () =>
        resolve({
          contenu: Buffer.concat(morceaux),
          nom: nomFichierLettre(l.nom, l.prenom, 'pdf', l.langue),
          pages,
          mise,
        }),
      );
      doc.on('error', reject);
      this.dessiner(doc, l, mise);
      doc.end();
    });
  }

  async pdf(versionId: string): Promise<PdfLettre> {
    return this.rendrePdf(
      await this.preparer(await this.depuisVersion(versionId)),
    );
  }

  /** L'apercu du backoffice : la lettre en cours de saisie, sans rien
   *  enregistrer. */
  async apercu(d: DonneesLettre): Promise<PdfLettre> {
    return this.rendrePdf(await this.preparer(d));
  }

  /**
   * La meme lettre en Word, avec la mise en page retenue pour le PDF : les
   * polices Word ont les memes chasses (Times New Roman, Arial) et
   * l'interligne est fixe, la lettre y tient donc aussi sur une page.
   */
  async docx(versionId: string): Promise<DocumentCv> {
    const l = await this.preparer(await this.depuisVersion(versionId));
    const mise = this.choisirMise(l);
    const t = tailles(mise);
    // Interligne fixe, en vingtiemes de point : celui de PDFKit (hauteur de
    // ligne de la police, ecart compris) plus l'interligne ajoute.
    const mesure = new PDFDocument({ size: 'A4' });
    const ligneCorps =
      mesure.font(l.polices.normal).fontSize(t.corps).currentLineHeight(true) +
      t.interligne;
    // Le retrait du bloc de droite, en vingtiemes de point : la largeur
    // utile moins celle du bloc, mesuree comme dans le PDF (les polices Word
    // ont les memes chasses).
    const largeurUtile = A4.largeur - 2 * mise.marge;
    const retrait = Math.round(
      // Trois points de jeu : Word ne doit pas couper la plus longue ligne.
      (largeurUtile - largeurBlocDroit(mesure, l, t.corps, largeurUtile) - 3) *
        20,
    );
    mesure.end();
    const exact = (pt: number) => ({
      line: Math.round(pt * 20),
      lineRule: LineRuleType.EXACT,
    });
    const texte = (s: string, gras = false, taille = t.corps) =>
      s.split('\n').map(
        (morceau, i) =>
          new TextRun({
            text: morceau,
            bold: gras,
            size: Math.round(taille * 2),
            ...(i > 0 ? { break: 1 } : {}),
          }),
      );
    const ligne = (n: number) => Math.round(n * ligneCorps * 20);

    const corps: Paragraph[] = [
      ...l.enTete.map(
        (s, i) =>
          new Paragraph({
            children: texte(s, i === 0, i === 0 ? t.nom : t.enTete),
          }),
      ),
      ...l.destinataire.map(
        (s, i) =>
          new Paragraph({
            children: texte(s),
            indent: { left: retrait },
            spacing: { ...exact(ligneCorps), before: i === 0 ? ligne(1.5) : 0 },
          }),
      ),
      new Paragraph({
        children: texte(l.lieuDate),
        indent: { left: retrait },
        spacing: { ...exact(ligneCorps), before: ligne(1.2) },
      }),
      ...(l.objet
        ? [
            new Paragraph({
              children: texte(l.objet, true),
              spacing: { ...exact(ligneCorps), before: ligne(1.5) },
            }),
          ]
        : []),
      ...l.sections.flatMap((s, i) => [
        ...(s.titre
          ? [
              new Paragraph({
                children: texte(s.titre, true),
                spacing: {
                  ...exact(ligneCorps),
                  before: i === 0 ? ligne(1.2) : 0,
                  after: Math.round(t.interligne * 1.5 * 20),
                },
              }),
            ]
          : []),
        ...s.paragraphes.map(
          (p, j) =>
            new Paragraph({
              children: texte(p),
              alignment: AlignmentType.JUSTIFIED,
              spacing: {
                ...exact(ligneCorps),
                before: i === 0 && j === 0 && !s.titre ? ligne(1.2) : 0,
                after: Math.round(t.apresParagraphe * 20),
              },
            }),
        ),
      ]),
      new Paragraph({
        children: texte(l.nomComplet),
        indent: { left: retrait },
        spacing: { before: Math.round(t.signature * 20) },
      }),
    ];

    const document = new Document({
      title: `${l.langue === 'en' ? 'Cover letter' : 'Lettre de motivation'} - ${l.nomComplet}`,
      creator: l.nomComplet,
      subject: l.objet ?? '',
      styles: {
        default: { document: { run: { font: l.polices.word } } },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: Math.round(mise.marge * 20),
                bottom: Math.round(mise.marge * 20),
                left: Math.round(mise.marge * 20),
                right: Math.round(mise.marge * 20),
              },
            },
          },
          children: corps,
        },
      ],
    });
    return {
      contenu: await Packer.toBuffer(document),
      nom: nomFichierLettre(l.nom, l.prenom, 'docx', l.langue),
    };
  }
}
