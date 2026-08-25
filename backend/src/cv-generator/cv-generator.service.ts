import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { ordonnerSections, type SectionBase } from './ordre-sections';

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
const NOM = 13;
const INTERLIGNE = 3;
/** Blanc avant un titre de section, en interlignes. */
const AVANT_SECTION = 0.9;

const LIEN = '#1A0DAB';
const ENCRE = '#000000';

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
  constructor(private readonly prisma: PrismaService) {}

  async generatePdf(): Promise<Buffer> {
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
      this.prisma.technology.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.certification.findMany({
        include: { organization: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.experience.findMany({ orderBy: { startDate: 'desc' } }),
      this.prisma.project.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.cvSection.findMany({ orderBy: { sortOrder: 'asc' } }),
    ]);

    const polices = choisirPolices(reglages?.cvFontFamily);

    // ── Sections alimentees par la base ──────────────────────────────────
    const base: SectionBase[] = [
      {
        titre: 'PRÉSENTATION',
        rang: RANG.presentation,
        lignes: presentations
          .map((p) => p.description ?? p.subtitle ?? p.title)
          .filter((l): l is string => Boolean(l)),
      },
      {
        titre: 'TECHNOLOGIES',
        rang: RANG.technologies,
        lignes: technologies.length
          ? [technologies.map((t) => t.label).join(', ')]
          : [],
      },
      {
        titre: 'CERTIFICATIONS',
        rang: RANG.certifications,
        lignes: certifications.map((c) => {
          const annee = c.issueDate ? new Date(c.issueDate).getFullYear() : null;
          const organisme = c.organization?.label ?? '';
          const suffixe = organisme ? ` – ${organisme}` : '';
          return `${annee ? `${annee} : ` : ''}${c.name}${suffixe}`;
        }),
      },
      {
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
        titre: 'PROJETS RÉALISÉS',
        rang: RANG.projets,
        lignes: projets.map((p, i) => {
          const detail = p.description ? ` : ${p.description}` : '';
          return `${i + 1}. ${p.name}${detail}`;
        }),
      },
    ];

    const sections = ordonnerSections(base, sectionsLibres);

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: MARGE, size: 'A4' });
      const morceaux: Buffer[] = [];
      doc.on('data', (c: Buffer) => morceaux.push(c));
      doc.on('end', () => resolve(Buffer.concat(morceaux)));
      doc.on('error', reject);

      const ligneSimple = (texte: string) =>
        doc.font(polices.normal).fontSize(CORPS).fillColor(ENCRE).text(texte);

      const lien = (etiquette: string, url: string) => {
        doc
          .font(polices.normal)
          .fontSize(CORPS)
          .fillColor(ENCRE)
          .text(etiquette, { continued: true })
          .fillColor(LIEN)
          .text(url, { link: url, underline: true })
          .fillColor(ENCRE);
      };

      // ── En-tete ────────────────────────────────────────────────────────
      const nomComplet = personalInfo
        ? `${personalInfo.name} ${personalInfo.surname}`.trim()
        : 'Curriculum Vitae';

      doc.font(polices.gras).fontSize(NOM).fillColor(ENCRE).text(nomComplet);
      doc.moveDown(0.25);

      if (personalInfo?.nationalite) ligneSimple(personalInfo.nationalite);
      // L'adresse postale ne sort que sur decision explicite : le CV est
      // telechargeable depuis un site public.
      if (personalInfo?.adresse && personalInfo.adressePublique) {
        ligneSimple(`Adresse : ${personalInfo.adresse}`);
      }
      if (personalInfo?.phone) ligneSimple(`Tel : ${personalInfo.phone}`);
      if (personalInfo?.email) lien('Email : ', personalInfo.email);
      if (personalInfo?.githubUrl) lien('Github : ', personalInfo.githubUrl);
      if (personalInfo?.linkedinUrl) lien('LinkedIn : ', personalInfo.linkedinUrl);

      // ── Sections ───────────────────────────────────────────────────────
      for (const section of sections) {
        doc.moveDown(AVANT_SECTION);
        doc
          .font(polices.gras)
          .fontSize(TITRE_SECTION)
          .fillColor(ENCRE)
          // toUpperCase() preserve les accents ('é' -> 'É'), et normalise ce
          // qui est saisi au backoffice sans imposer la saisie en capitales.
          .text(section.titre.toUpperCase());
        doc.moveDown(0.2);

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
            .text(numerotee ? entree : `• ${entree}`, {
              indent: numerotee ? 0 : 0,
              lineGap: INTERLIGNE - 2,
            });
        }
      }

      doc.end();
    });
  }
}
