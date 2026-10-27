import { ligneCours, ligneExperience, moisAnnee } from './contenu-cv';
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
});
