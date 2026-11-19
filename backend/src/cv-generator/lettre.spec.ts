import {
  aUnCorps,
  enTeteParDefaut,
  MISES_EN_PAGE,
  sectionsAEnregistrer,
  sectionsLettre,
  ligneLieuDate,
  ligneObjet,
  lignesDe,
  nomFichierLettre,
  paragraphesDe,
} from './lettre';

const jour = new Date('2026-11-19T00:00:00.000Z');

describe('enTeteParDefaut', () => {
  const info = {
    name: 'BENYO',
    surname: 'Fanuel Kokou',
    adresse: '12 rue des Palmiers',
    adressePublique: false,
    phone: '+228 70300298',
    email: 'f@exemple.tg',
  };

  it('une ligne par information, le portfolio sans https://', () => {
    expect(enTeteParDefaut(info, 'https://fanu.dev/')).toBe(
      'BENYO Fanuel Kokou\n+228 70300298\nf@exemple.tg\nfanu.dev',
    );
  });

  it('n ajoute l adresse que si elle est publique', () => {
    expect(enTeteParDefaut(info)).not.toContain('Palmiers');
    expect(enTeteParDefaut({ ...info, adressePublique: true })).toContain(
      '12 rue des Palmiers',
    );
  });

  it('saute les informations absentes', () => {
    expect(enTeteParDefaut({ name: 'BENYO', phone: ' ' }, null)).toBe('BENYO');
    expect(enTeteParDefaut(null, null)).toBe('');
  });
});

describe('ligneLieuDate', () => {
  it('en francais, avec et sans lieu', () => {
    expect(ligneLieuDate('Lomé', null, 'fr', jour)).toBe(
      'Lomé, le 19 novembre 2026',
    );
    expect(ligneLieuDate('  ', null, 'fr', jour)).toBe('Le 19 novembre 2026');
  });

  it('en anglais', () => {
    expect(ligneLieuDate('Lomé', null, 'en', jour)).toBe(
      'Lomé, 19 November 2026',
    );
    expect(ligneLieuDate(null, null, 'en', jour)).toBe('19 November 2026');
  });

  it('une date fixee prime sur le jour de la generation', () => {
    expect(
      ligneLieuDate('Lomé', new Date('2026-11-25T00:00:00.000Z'), 'fr', jour),
    ).toBe('Lomé, le 25 novembre 2026');
  });
});

describe('ligneObjet', () => {
  it('prefixe selon la langue, rien sans objet', () => {
    expect(ligneObjet('Candidature', 'fr')).toBe('Objet : Candidature');
    expect(ligneObjet('Application', 'en')).toBe('Subject: Application');
    expect(ligneObjet('  ')).toBeNull();
  });
});

describe('paragraphesDe', () => {
  it('coupe aux lignes vides, garde les retours dans un paragraphe', () => {
    expect(
      paragraphesDe(
        'Monsieur,\r\n\r\nPremiere ligne\nseconde ligne\n\n\n  \nFin.  ',
      ),
    ).toEqual(['Monsieur,', 'Premiere ligne\nseconde ligne', 'Fin.']);
  });

  it('un corps vide ne donne aucun paragraphe', () => {
    expect(paragraphesDe(' \n \n')).toEqual([]);
    expect(paragraphesDe(null)).toEqual([]);
  });
});

describe('lignesDe', () => {
  it('jette les lignes blanches', () => {
    expect(lignesDe(' A \n\n B ')).toEqual(['A', 'B']);
  });
});

describe('nomFichierLettre', () => {
  it('sans accents, suffixe anglais', () => {
    expect(nomFichierLettre('BENYO', 'Fanuel Kokou', 'pdf')).toBe(
      'Lettre_BENYO_Fanuel_Kokou.pdf',
    );
    expect(nomFichierLettre('Éloi', 'Zoé', 'docx', 'en')).toBe(
      'Lettre_Eloi_Zoe_EN.docx',
    );
  });
});

describe('sections de la lettre', () => {
  it('garde le titre facultatif et coupe le texte en paragraphes', () => {
    expect(
      sectionsLettre([
        { titre: null, corps: 'Madame,\n\nJe postule.' },
        { titre: '  Pieces jointes ', corps: 'CV' },
      ]),
    ).toEqual([
      { titre: null, paragraphes: ['Madame,', 'Je postule.'] },
      { titre: 'Pieces jointes', paragraphes: ['CV'] },
    ]);
  });

  it('ecarte les sections vides et ce qui n est pas une liste', () => {
    expect(sectionsLettre([{ titre: ' ', corps: ' \n ' }, null, 3])).toEqual(
      [],
    );
    expect(sectionsLettre({ corps: 'x' })).toEqual([]);
    expect(sectionsLettre(null)).toEqual([]);
  });

  it('un titre sans texte ne suffit pas a faire une lettre', () => {
    expect(aUnCorps(sectionsLettre([{ titre: 'Seul' }]))).toBe(false);
    expect(aUnCorps(sectionsLettre([{ corps: 'Texte' }]))).toBe(true);
  });

  it('enregistre les sections nettoyees, dans l ordre', () => {
    expect(
      sectionsAEnregistrer([
        { titre: '', corps: ' A\r\nB ' },
        { titre: ' ', corps: '' },
        { titre: 'P.-S.', corps: '' },
      ]),
    ).toEqual([
      { titre: null, corps: 'A\nB' },
      { titre: 'P.-S.', corps: '' },
    ]);
    expect(sectionsAEnregistrer(undefined)).toEqual([]);
  });
});

describe('MISES_EN_PAGE', () => {
  it('va de la plus confortable a la plus serree', () => {
    expect(MISES_EN_PAGE[0]).toEqual({ corps: 11, marge: 56 });
    for (let i = 1; i < MISES_EN_PAGE.length; i++) {
      const [a, b] = [MISES_EN_PAGE[i - 1], MISES_EN_PAGE[i]];
      expect(b.corps <= a.corps && b.marge <= a.marge).toBe(true);
      expect(b.corps < a.corps || b.marge < a.marge).toBe(true);
    }
  });
});
