import {
  avecBrouillon,
  ordonnerSections,
  rangsBase,
  rangsDepuisOrdre,
  RANGS_BASE_DEFAUT,
  sansMasquees,
} from './ordre-sections';

const base = [
  { titre: 'PRESENTATION', lignes: ['Ingenieur logiciel'], rang: 10 },
  { titre: 'TECHNOLOGIES', lignes: ['Java, Python'], rang: 30 },
];

function libre(
  o: Partial<Parameters<typeof ordonnerSections>[1][number]> = {},
) {
  return {
    titre: 'FORMATIONS',
    lignes: '2022-2025 : Licence professionnelle',
    publique: true,
    sortOrder: 20,
    ...o,
  };
}

describe('ordonnerSections', () => {
  it('intercale une section libre entre deux sections de la base', () => {
    const r = ordonnerSections(base, [libre()]);
    expect(r.map((s) => s.titre)).toEqual([
      'PRESENTATION',
      'FORMATIONS',
      'TECHNOLOGIES',
    ]);
  });

  it('place une section libre apres toute la base quand son rang est superieur', () => {
    const r = ordonnerSections(base, [
      libre({ titre: 'LANGUES', sortOrder: 70 }),
    ]);
    expect(r[r.length - 1].titre).toBe('LANGUES');
  });

  it('ecarte une section libre non publique', () => {
    const r = ordonnerSections(base, [
      libre({ titre: 'REFERENCES', publique: false }),
    ]);
    expect(r.map((s) => s.titre)).not.toContain('REFERENCES');
  });

  it('ecarte une section libre sans aucune ligne utile', () => {
    const r = ordonnerSections(base, [libre({ lignes: '   \n\n  \n' })]);
    expect(r.map((s) => s.titre)).not.toContain('FORMATIONS');
  });

  it('ecarte une section de la base sans aucune ligne', () => {
    const r = ordonnerSections([{ titre: 'VIDE', lignes: [], rang: 10 }], []);
    expect(r).toEqual([]);
  });

  it('decoupe les lignes et retire les blancs', () => {
    const r = ordonnerSections(
      [],
      [libre({ lignes: '  une  \n\n deux \n   \n trois ' })],
    );
    expect(r[0].lignes).toEqual(['une', 'deux', 'trois']);
  });

  it('garde la section de la base avant la libre a rang egal', () => {
    const r = ordonnerSections(
      [{ titre: 'BASE', lignes: ['x'], rang: 30 }],
      [libre({ titre: 'LIBRE', sortOrder: 30 })],
    );
    expect(r.map((s) => s.titre)).toEqual(['BASE', 'LIBRE']);
  });

  it('renvoie un tableau vide quand il n y a rien a dire', () => {
    expect(ordonnerSections([], [])).toEqual([]);
  });

  it('ne modifie pas les tableaux qu on lui passe', () => {
    const b = [...base];
    const l = [libre()];
    ordonnerSections(b, l);
    expect(b).toEqual(base);
    expect(l[0].sortOrder).toBe(20);
  });
});

describe('le brouillon de l apercu', () => {
  const enBase = [
    {
      id: 'a',
      titre: 'LANGUES',
      lignes: 'Francais',
      publique: true,
      sortOrder: 20,
    },
    {
      id: 'b',
      titre: 'LOISIRS',
      lignes: 'Lecture',
      publique: true,
      sortOrder: 70,
    },
  ];

  it('remplace la section en cours de modification, par son id', () => {
    const r = avecBrouillon(enBase, {
      id: 'a',
      titre: 'LANGUES',
      lignes: 'Francais\nAnglais',
      publique: true,
      sortOrder: 20,
    });
    expect(r).toHaveLength(2);
    expect(r.find((x) => x.id === 'a')?.lignes).toBe('Francais\nAnglais');
  });

  it('ajoute une nouvelle section, sans id', () => {
    const r = avecBrouillon(enBase, {
      titre: 'BENEVOLAT',
      lignes: 'Croix-Rouge',
      publique: true,
      sortOrder: 65,
    });
    expect(r.map((x) => x.titre)).toEqual(['LANGUES', 'LOISIRS', 'BENEVOLAT']);
  });

  it('sans brouillon, rend les sections telles quelles', () => {
    expect(avecBrouillon(enBase, undefined)).toEqual(enBase);
  });

  it('ne modifie pas les sections enregistrees', () => {
    const copie = enBase.map((x) => ({ ...x }));
    avecBrouillon(enBase, {
      id: 'a',
      titre: 'X',
      lignes: 'y',
      publique: false,
      sortOrder: 1,
    });
    expect(enBase).toEqual(copie);
  });

  it('un brouillon prive disparait du CV, comme il le fera une fois enregistre', () => {
    const r = ordonnerSections(
      [],
      avecBrouillon(enBase, {
        id: 'a',
        titre: 'LANGUES',
        lignes: 'Francais',
        publique: false,
        sortOrder: 20,
      }),
    );
    expect(r.map((x) => x.titre)).toEqual(['LOISIRS']);
  });
});

describe('les lignes a deux colonnes', () => {
  it('passent de la base au document, avec leurs lignes', () => {
    const paires = [{ etiquette: 'Langages', valeur: 'Java' }];
    const r = ordonnerSections(
      [
        {
          titre: 'TECHNOLOGIES',
          lignes: ['Langages : Java'],
          rang: 30,
          paires,
        },
      ],
      [],
    );
    expect(r[0].paires).toEqual(paires);
  });

  it('une section sans paires n en porte pas', () => {
    const r = ordonnerSections(
      [{ titre: 'PRESENTATION', lignes: ['x'], rang: 10 }],
      [],
    );
    expect(r[0].paires).toBeUndefined();
  });
});

describe('les sections de la base masquees', () => {
  const avecCles = [
    { cle: 'presentation', titre: 'PRESENTATION', lignes: ['x'], rang: 10 },
    { cle: 'technologies', titre: 'TECHNOLOGIES', lignes: ['y'], rang: 30 },
  ];

  it('retire celles dont la cle est masquee', () => {
    expect(
      sansMasquees(avecCles, ['technologies']).map((s) => s.titre),
    ).toEqual(['PRESENTATION']);
  });

  it('sans masque, garde tout', () => {
    expect(sansMasquees(avecCles, [])).toHaveLength(2);
  });

  it('ignore une cle inconnue', () => {
    expect(sansMasquees(avecCles, ['inconnue'])).toHaveLength(2);
  });
});

describe('format des sections libres', () => {
  const corps = 'Francais (natif)\n\nAnglais (courant)\n';

  it('met une puce par entree par defaut', () => {
    const [s] = ordonnerSections([], [libre({ lignes: corps })]);
    expect(s.lignes).toEqual(['Francais (natif)', 'Anglais (courant)']);
    expect(s.sansPuce).toBeUndefined();
  });

  it('reunit les entrees sur une ligne, separees par des virgules', () => {
    const [s] = ordonnerSections(
      [],
      [libre({ lignes: corps, format: 'virgules' })],
    );
    expect(s.lignes).toEqual(['Francais (natif), Anglais (courant)']);
    expect(s.sansPuce).toBe(true);
  });

  it('garde une entree par ligne, sans puce', () => {
    const [s] = ordonnerSections(
      [],
      [libre({ lignes: corps, format: 'lignes' })],
    );
    expect(s.lignes).toHaveLength(2);
    expect(s.sansPuce).toBe(true);
  });

  it('omet une section en virgules sans entree', () => {
    expect(
      ordonnerSections([], [libre({ lignes: ' \n', format: 'virgules' })]),
    ).toEqual([]);
  });
});

describe('rangsBase', () => {
  it('reprend les rangs d origine sans reglage', () => {
    expect(rangsBase({})).toEqual(RANGS_BASE_DEFAUT);
    expect(rangsBase(null)).toEqual(RANGS_BASE_DEFAUT);
  });

  it('applique les rangs enregistres et ignore le reste', () => {
    const r = rangsBase({
      projets: 15,
      loisirs: 1,
      cours: -3,
      experiences: 'x',
    });
    expect(r.projets).toBe(15);
    expect(r.cours).toBe(RANGS_BASE_DEFAUT.cours);
    expect(r.experiences).toBe(RANGS_BASE_DEFAUT.experiences);
    expect(r).not.toHaveProperty('loisirs');
  });
});

describe('rangsDepuisOrdre', () => {
  it('numerote de 10 en 10 et separe la base des sections libres', () => {
    expect(rangsDepuisOrdre(['projets', 'abc-1', 'presentation'])).toEqual({
      base: { projets: 10, presentation: 30 },
      libres: [{ id: 'abc-1', sortOrder: 20 }],
    });
  });

  it('donne un ordre que ordonnerSections reproduit', () => {
    const { base: rangs, libres } = rangsDepuisOrdre([
      'technologies',
      'abc-1',
      'presentation',
    ]);
    const r = ordonnerSections(
      [
        { ...base[0], rang: rangs.presentation! },
        { ...base[1], rang: rangs.technologies! },
      ],
      [libre({ sortOrder: libres[0].sortOrder })],
    );
    expect(r.map((s) => s.titre)).toEqual([
      'TECHNOLOGIES',
      'FORMATIONS',
      'PRESENTATION',
    ]);
  });
});
