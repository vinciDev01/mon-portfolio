import { hrefDeLien, lignesContact, nomFichier } from './en-tete';

const complet = {
  nationalite: 'Togolais',
  adresse: 'Agbalepedo, non loin de la station E.TRA.B',
  adressePublique: false,
  phone: '(+228) 70 30 02 98',
  email: 'kokoubenyo01@gmail.com',
  githubUrl: 'https://github.com/vinciDev01',
  linkedinUrl: 'https://www.linkedin.com/in/kokou-benyo',
};

describe('lignesContact', () => {
  it('ne rend rien sans informations personnelles', () => {
    expect(lignesContact(null)).toEqual([]);
  });

  it('omet l adresse tant qu elle n est pas declaree publique', () => {
    const lignes = lignesContact(complet);
    expect(lignes.some((l) => l.genre === 'texte' && l.texte.includes('Agbalepedo'))).toBe(false);
  });

  it('rend l adresse une fois declaree publique', () => {
    const lignes = lignesContact({ ...complet, adressePublique: true });
    expect(lignes).toContainEqual({
      genre: 'texte',
      texte: 'Adresse : Agbalepedo, non loin de la station E.TRA.B',
    });
  });

  it('n invente pas d adresse publique quand le champ est vide', () => {
    const lignes = lignesContact({ ...complet, adresse: null, adressePublique: true });
    expect(lignes.some((l) => l.genre === 'texte' && l.texte.startsWith('Adresse'))).toBe(false);
  });

  it('suit l ordre du canevas', () => {
    const lignes = lignesContact({ ...complet, adressePublique: true });
    expect(lignes.map((l) => (l.genre === 'texte' ? l.texte.split(' :')[0] : l.etiquette))).toEqual([
      'Togolais',
      'Adresse',
      'Tel',
      'Email : ',
      'Github : ',
      'LinkedIn : ',
    ]);
  });

  it('rend email, github et linkedin comme des liens', () => {
    const liens = lignesContact(complet).filter((l) => l.genre === 'lien');
    expect(liens).toHaveLength(3);
    expect(liens[0]).toMatchObject({ url: 'kokoubenyo01@gmail.com' });
  });

  it('ignore chaque champ absent', () => {
    const lignes = lignesContact({
      nationalite: null,
      adresse: null,
      adressePublique: false,
      phone: null,
      email: 'a@b.c',
      githubUrl: null,
      linkedinUrl: null,
    });
    expect(lignes).toHaveLength(1);
  });

  it('ignore les champs qui ne contiennent que des blancs', () => {
    const lignes = lignesContact({ ...complet, nationalite: '   ', phone: '' });
    expect(lignes.some((l) => l.genre === 'texte')).toBe(false);
  });
});

describe('nomFichier', () => {
  it('compose le nom depuis l identite', () => {
    expect(nomFichier('BENYO', 'Fanuel Kokou', 'pdf')).toBe('CV_BENYO_Fanuel_Kokou.pdf');
  });

  it('retire les diacritiques, qu un systeme de fichiers peut mal rendre', () => {
    expect(nomFichier('Éloïse', 'Gbalè', 'docx')).toBe('CV_Eloise_Gbale.docx');
  });

  it('ecarte tout caractere qui n a rien a faire dans un nom de fichier', () => {
    expect(nomFichier('A/B\\C:D', '*E?', 'pdf')).toBe('CV_ABCD_E.pdf');
  });

  it('retombe sur un nom neutre quand l identite est vide', () => {
    expect(nomFichier('', '   ', 'pdf')).toBe('CV.pdf');
  });

  it('ne laisse jamais de tiret bas en trop', () => {
    expect(nomFichier('  BENYO  ', '', 'docx')).toBe('CV_BENYO.docx');
  });
});

describe('hrefDeLien', () => {
  it('prefixe une adresse electronique en mailto', () => {
    expect(hrefDeLien('a@b.c')).toBe('mailto:a@b.c');
  });

  it('laisse intacte une URL qui porte deja son schema', () => {
    expect(hrefDeLien('https://github.com/x')).toBe('https://github.com/x');
  });

  it('complete un domaine nu en https', () => {
    expect(hrefDeLien('github.com/x')).toBe('https://github.com/x');
  });

  it('ne redouble pas un mailto deja present', () => {
    expect(hrefDeLien('mailto:a@b.c')).toBe('mailto:a@b.c');
  });
});
