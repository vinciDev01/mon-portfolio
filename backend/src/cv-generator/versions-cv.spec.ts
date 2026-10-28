import { NotFoundException } from '@nestjs/common';
import { CvGeneratorService } from './cv-generator.service';

/** Un vrai rendu PDF ou Word (polices, QR code) : sous la charge de toute
 *  la suite en parallele, il peut depasser les 5 s par defaut de Jest. */
const RENDU_MS = 20_000;

const vide = () => ({
  findMany: jest.fn().mockResolvedValue([]),
  findFirst: jest.fn().mockResolvedValue(null),
});
const exp = {
  id: 'e1',
  role: 'Ingenieur',
  company: 'OssanAsur',
  description: null,
  startDate: new Date('2026-03-01T00:00:00.000Z'),
  endDate: null,
  isCurrent: true,
  projects: [
    { id: 'p1', name: 'OssanFina', description: 'Microfinance.' },
    { id: 'p2', name: 'GAD', description: 'Attestations.' },
  ],
};

function base(version: Record<string, unknown> | null) {
  return {
    personalInfo: vide(),
    siteSettings: {
      findFirst: jest.fn().mockResolvedValue({
        cvJobTitle: 'Titre general',
        cvBaseMasquees: ['cours'],
      }),
    },
    presentation: {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { title: 'T', description: 'Presentation de base' },
        ]),
    },
    technology: vide(),
    certification: vide(),
    cvSection: vide(),
    cours: vide(),
    experience: { findMany: jest.fn().mockResolvedValue([exp]) },
    project: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'p3',
          name: 'AGBLE',
          description: 'Agricole.',
          experienceId: null,
        },
        {
          id: 'p4',
          name: 'Portfolio',
          description: 'Site.',
          experienceId: null,
        },
      ]),
    },
    skill: {
      findMany: jest.fn().mockResolvedValue([
        { id: 's1', label: 'Management', family: null },
        { id: 's2', label: 'Veille', family: null },
      ]),
    },
    cvVersion: { findUnique: jest.fn().mockResolvedValue(version) },
  };
}

type Collecte = {
  sections: {
    titre: string;
    lignes: string[];
    postes?: { projets: { nom: string }[] }[];
    projets?: { nom: string }[];
  }[];
  titre: string | null;
};
const collecter = (prisma: ReturnType<typeof base>, version: unknown) =>
  (
    new CvGeneratorService(prisma as never) as unknown as {
      collecter: (
        b: undefined,
        l: 'fr' | 'en',
        v: unknown,
      ) => Promise<Collecte>;
    }
  ).collecter(undefined, 'fr', version);

describe('versions du CV', () => {
  const version = {
    id: 'v1',
    nom: 'Back-end',
    langue: 'en',
    titrePoste: 'Java Developer',
    presentation: 'Presentation de la version',
    sectionsMasquees: ['competences'],
    projetIds: ['p1', 'p4'],
    technologieIds: ['t9'],
    competenceIds: ['s2'],
  };

  it('ne garde que les projets retenus, sous le poste comme dans Projets realises', async () => {
    const r = await collecter(base(version), version);
    const exps = r.sections.find((s) => s.postes)!;
    expect(exps.postes![0].projets.map((p) => p.nom)).toEqual(['OssanFina']);
    const persos = r.sections.find((s) => s.projets && !s.postes)!;
    expect(persos.projets!.map((p) => p.nom)).toEqual(['Portfolio']);
  });

  it('sa presentation et son titre remplacent ceux de la base', async () => {
    const r = await collecter(base(version), version);
    expect(r.titre).toBe('Java Developer');
    expect(r.sections[0].lignes).toEqual(['Presentation de la version']);
  });

  it('ses sections masquees remplacent le reglage general', async () => {
    const prisma = base(version);
    prisma.cours = {
      findMany: jest
        .fn()
        .mockResolvedValue([
          { titre: 'Java', niveau: 'debutant', pages: 1, technology: null },
        ]),
      findFirst: jest.fn(),
    };
    const r = await collecter(prisma, version);
    // Competences masquees par la version ; cours, masque par le reglage general, revient.
    expect(
      r.sections.some((s) => s.lignes.some((l) => l.includes('Veille'))),
    ).toBe(false);
    expect(
      r.sections.some((s) => s.lignes.some((l) => l.startsWith('Java'))),
    ).toBe(true);
  });

  it('ne garde que les competences retenues', async () => {
    const v = { ...version, sectionsMasquees: [] };
    const r = await collecter(base(v), v);
    const lignes = r.sections.flatMap((s) => s.lignes).join(' ');
    expect(lignes).toContain('Veille');
    expect(lignes).not.toContain('Management');
  });

  it('demande ses technologies telles quelles, sans le filtre « dans le CV »', async () => {
    const prisma = base(version);
    await collecter(prisma, version);
    expect(prisma.technology.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['t9'] } } }),
    );
  });

  it('une version vide donne le CV complet', async () => {
    const v = {
      ...version,
      titrePoste: null,
      presentation: null,
      projetIds: [],
      technologieIds: [],
      competenceIds: [],
      sectionsMasquees: [],
    };
    const r = await collecter(base(v), v);
    expect(r.titre).toBe('Titre general');
    expect(r.sections.find((s) => s.postes)!.postes![0].projets).toHaveLength(
      2,
    );
  });

  it(
    'la langue de la version prime, une version inconnue est un 404',
    async () => {
      const service = new CvGeneratorService(base(version) as never);
      expect((await service.generatePdf(undefined, 'fr', 'v1')).nom).toMatch(
        /_EN\.pdf$/,
      );
      const inconnue = new CvGeneratorService(base(null) as never);
      await expect(inconnue.generatePdf(undefined, 'fr', 'zz')).rejects.toThrow(
        NotFoundException,
      );
    },
    RENDU_MS,
  );
});
