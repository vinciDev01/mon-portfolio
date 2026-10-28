import { ligneCours, ligneExperience, moisAnnee, posteDe, projetCv, resumeProjet, suiteProjet } from './contenu-cv';
import { ordonnerSections } from './ordre-sections';
import { CvGeneratorService } from './cv-generator.service';
import { CLES_SECTIONS_BASE } from './ordre-sections';

const exp = {
  role: 'Développeur',
  company: 'OssanAsur',
  description: null as string | null,
  startDate: new Date('2025-07-01T00:00:00.000Z'),
  endDate: new Date('2026-02-01T00:00:00.000Z') as Date | null,
  isCurrent: false,
};

describe('lignes du CV', () => {
  it('date en UTC : le 1er juillet a minuit UTC reste juillet', () => {
    expect(moisAnnee(new Date('2025-07-01T00:00:00.000Z'))).toBe('Juillet 2025');
    expect(moisAnnee(null)).toBe('');
  });

  it('une experience nue : periode, poste, entreprise', () => {
    expect(ligneExperience(exp)).toBe('Juillet 2025 à Février 2026 : Développeur à OssanAsur.');
  });

  it('en cours : jusqu a aujourd hui', () => {
    expect(ligneExperience({ ...exp, isCurrent: true, endDate: null })).toMatch(/à aujourd'hui : /);
  });

  it('avec ce qui y a ete fait et ses projets, sans double point', () => {
    const l = ligneExperience({ ...exp, description: '  Applications   web et mobiles.' }, ['AGBLE', 'Dumevi']);
    expect(l).toBe(
      'Juillet 2025 à Février 2026 : Développeur à OssanAsur. Applications web et mobiles. Projets : AGBLE, Dumevi.',
    );
  });

  it('chaque projet d une experience dit ce qu il est, en quelques mots', () => {
    const l = ligneExperience(exp, [
      { name: 'OssanFina', description: 'Plateforme de gestion pour institutions de microfinance : clients, credits.' },
      { name: 'Sans', description: null },
    ]);
    expect(l).toMatch(/Projets : OssanFina \(plateforme de gestion pour institutions de microfinance\), Sans\.$/);
  });

  it('le resume s arrete au premier deux-points ou point, et renonce s il est trop long', () => {
    expect(resumeProjet("Gestion des sinistres automobiles : declaration.")).toBe('gestion des sinistres automobiles');
    expect(resumeProjet('Application mobile. Suite du texte.')).toBe('application mobile');
    expect(resumeProjet('x'.repeat(120))).toBeNull();
    expect(resumeProjet(null)).toBeNull();
  });

  it('une description sans point final en recoit un', () => {
    expect(ligneExperience({ ...exp, description: 'Equipe Agile' })).toMatch(/Equipe Agile\.$/);
  });

  it('un cours : titre, technologie, niveau, pages', () => {
    expect(ligneCours({ titre: 'Java pas a pas', niveau: 'debutant', pages: 120, technology: { label: 'Java' } })).toBe(
      'Java pas a pas (Java, niveau débutant, 120 pages)',
    );
    expect(ligneCours({ titre: 'Seul', niveau: 'inconnu', pages: null, technology: null })).toBe('Seul');
  });

  it('les nouvelles sections se masquent depuis le backoffice comme les autres', () => {
    expect(CLES_SECTIONS_BASE).toEqual(
      expect.arrayContaining(['competences', 'cours', 'experiences', 'projets']),
    );
  });

  it('un poste structure : intitule, employeur, periode, description, projets et technologies', () => {
    const p = posteDe({ ...exp, isCurrent: true, endDate: null, description: 'Back-ends Java' }, [
      {
        name: 'OssanFina',
        description: 'Plateforme de microfinance : credits.',
        technologies: [{ technology: { label: 'Spring Boot' } }, { technology: { label: 'React' } }],
      },
    ]);
    expect(p).toEqual({
      intitule: 'Développeur',
      employeur: 'OssanAsur',
      periode: "Juillet 2025 à aujourd'hui",
      description: 'Back-ends Java.',
      projets: [{ nom: 'OssanFina', resume: 'plateforme de microfinance', technologies: ['Spring Boot', 'React'] }],
    });
  });

  it('un projet personnel garde sa description entiere ; la suite est ponctuee une fois', () => {
    const p = projetCv({ name: 'AGBLE', description: 'Gestion agricole. Suivi des parcelles' }, true);
    expect(p.resume).toBe('Gestion agricole. Suivi des parcelles.');
    expect(suiteProjet(p.resume)).toBe(' : Gestion agricole. Suivi des parcelles.');
    expect(suiteProjet('plateforme')).toBe(' : plateforme.');
    expect(suiteProjet(null)).toBe('');
  });

  it('les postes passent jusqu au rendu', () => {
    const postes = [posteDe(exp)];
    const [s] = ordonnerSections([{ titre: 'EXP', lignes: ['x'], rang: 20, postes }], []);
    expect(s.postes).toEqual(postes);
  });
});

describe('rendu des experiences', () => {
  const vide = () => ({ findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) });
  const base = () => ({
    personalInfo: vide(), siteSettings: vide(), presentation: vide(), technology: vide(), certification: vide(),
    cvSection: vide(), skill: vide(), cours: vide(),
    project: {
      findMany: jest.fn().mockResolvedValue([
        { name: 'AGBLE', description: 'Gestion agricole.', experienceId: null, technologies: [{ technology: { label: 'Flutter' } }] },
        { name: 'OssanFina', description: 'Microfinance.', experienceId: 'e1', technologies: [] },
      ]),
    },
    experience: {
      findMany: jest.fn().mockResolvedValue([
        {
          ...exp,
          isCurrent: true,
          endDate: null,
          description: 'Conception et developpement.',
          projects: [
            { name: 'OssanFina', description: 'Plateforme de microfinance : credits.', technologies: [{ technology: { label: 'React' } }] },
            { name: 'GAD', description: null, technologies: [] },
          ],
        },
      ]),
    },
  });

  it('le PDF et le Word se generent avec postes et projets', async () => {
    const service = new CvGeneratorService(base() as never);
    const pdf = await service.generatePdf();
    expect(pdf.contenu.subarray(0, 4).toString()).toBe('%PDF');
    const docx = await service.generateDocx();
    // Un .docx est une archive zip.
    expect(docx.contenu.subarray(0, 2).toString()).toBe('PK');
  });

  it('demande les technologies des projets de chaque experience', async () => {
    const prisma = base();
    await new CvGeneratorService(prisma as never).generatePdf();
    const appel = prisma.experience.findMany.mock.calls[0][0];
    expect(appel.include.projects.select.technologies).toBeDefined();
  });
});
