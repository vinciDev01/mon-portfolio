import { ordonnerSections } from './ordre-sections';

const base = [
  { titre: 'PRESENTATION', lignes: ['Ingenieur logiciel'], rang: 10 },
  { titre: 'TECHNOLOGIES', lignes: ['Java, Python'], rang: 30 },
];

function libre(o: Partial<Parameters<typeof ordonnerSections>[1][number]> = {}) {
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
    const r = ordonnerSections(base, [libre({ titre: 'LANGUES', sortOrder: 70 })]);
    expect(r[r.length - 1].titre).toBe('LANGUES');
  });

  it('ecarte une section libre non publique', () => {
    const r = ordonnerSections(base, [libre({ titre: 'REFERENCES', publique: false })]);
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
    const r = ordonnerSections([], [libre({ lignes: '  une  \n\n deux \n   \n trois ' })]);
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
