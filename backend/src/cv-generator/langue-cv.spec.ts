import { choisir, langueCv, TEXTES } from './langue-cv';
import { ligneCours, ligneExperience, moisAnnee, posteDe, projetCv, suiteProjet } from './contenu-cv';
import { lignesContact, nomFichier } from './en-tete';
import { grouperTechnologies } from './technologies-cv';

const exp = {
  role: 'Ingénieur Logiciel',
  roleEn: 'Software Engineer',
  company: 'OssanAsur',
  description: 'Intervention sur des systèmes bancaires.',
  descriptionEn: 'Banking and insurance systems.',
  startDate: new Date('2026-03-01T00:00:00.000Z'),
  endDate: null,
  isCurrent: true,
};

describe('langue du CV', () => {
  it('une langue inconnue donne le francais', () => {
    expect(langueCv('en')).toBe('en');
    expect(langueCv('de')).toBe('fr');
    expect(langueCv(undefined)).toBe('fr');
  });

  it('choisit l anglais s il est renseigne, sinon le francais', () => {
    expect(choisir('Bonjour', 'Hello', 'en')).toBe('Hello');
    expect(choisir('Bonjour', '  ', 'en')).toBe('Bonjour');
    expect(choisir('Bonjour', null, 'en')).toBe('Bonjour');
    expect(choisir('Bonjour', 'Hello', 'fr')).toBe('Bonjour');
  });

  it('dates et periode en anglais', () => {
    expect(moisAnnee(new Date('2026-03-01T00:00:00.000Z'), 'en')).toBe('March 2026');
    expect(posteDe(exp, [], 'en')).toMatchObject({
      intitule: 'Software Engineer',
      periode: 'March 2026 to present',
      description: 'Banking and insurance systems.',
    });
  });

  it('un poste sans traduction reprend le francais', () => {
    expect(posteDe({ ...exp, roleEn: null, descriptionEn: '' }, [], 'en')).toMatchObject({
      intitule: 'Ingénieur Logiciel',
      description: 'Intervention sur des systèmes bancaires.',
    });
  });

  it('projets : la version anglaise du resume, la typographie anglaise', () => {
    const p = { name: 'OssanFina', description: 'Plateforme : x.', cvSummary: 'Digitalisation', cvSummaryEn: 'Digitalisation of microfinance' };
    expect(projetCv(p, false, 'en').resume).toBe('digitalisation of microfinance');
    expect(suiteProjet('banking', 'en')).toBe(': banking.');
    expect(suiteProjet('banque', 'fr')).toBe(' : banque.');
    expect(ligneExperience(exp, [p], 'en')).toBe(
      'March 2026 to present: Software Engineer at OssanAsur. Banking and insurance systems. Projects: OssanFina (digitalisation of microfinance).',
    );
  });

  it('cours, coordonnees, famille sans nom et nom de fichier en anglais', () => {
    expect(ligneCours({ titre: 'Java', titreEn: 'Java basics', niveau: 'debutant', pages: 10, technology: { label: 'Java' } }, 'en')).toBe(
      'Java basics (Java, level beginner, 10 pages)',
    );
    expect(lignesContact({ adressePublique: false, phone: '+228', email: 'a@b.c' }, 'en')).toEqual([
      { genre: 'texte', texte: 'Phone: +228' },
      { genre: 'lien', etiquette: 'Email: ', url: 'a@b.c' },
    ]);
    expect(grouperTechnologies([{ label: 'X', family: null }, { label: 'Y', family: { name: 'Web', sortOrder: 0 } }], 'Other')).toContainEqual({ etiquette: 'Other', valeur: 'X' });
    expect(nomFichier('BENYO', 'Fanuel', 'pdf', 'en')).toBe('CV_BENYO_Fanuel_EN.pdf');
    expect(nomFichier('BENYO', 'Fanuel', 'pdf')).toBe('CV_BENYO_Fanuel.pdf');
  });

  it('les deux langues ont les memes cles', () => {
    expect(Object.keys(TEXTES.en.titres).sort()).toEqual(Object.keys(TEXTES.fr.titres).sort());
    expect(Object.keys(TEXTES.en.contact).sort()).toEqual(Object.keys(TEXTES.fr.contact).sort());
  });
});
