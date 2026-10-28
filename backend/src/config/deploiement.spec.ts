import {
  lireOriginesAutorisees,
  ORIGINES_DE_DEVELOPPEMENT,
  swaggerActif,
} from './deploiement';

describe('lireOriginesAutorisees', () => {
  it('rend les origines locales quand rien n est defini', () => {
    expect(lireOriginesAutorisees({})).toEqual(ORIGINES_DE_DEVELOPPEMENT);
  });

  it('lit une liste separee par des virgules, espaces compris', () => {
    expect(
      lireOriginesAutorisees({
        CORS_ORIGINS: 'https://exemple.dev, https://admin.exemple.dev',
      }),
    ).toEqual(['https://exemple.dev', 'https://admin.exemple.dev']);
  });

  it('retire la barre finale, que le navigateur n envoie jamais', () => {
    expect(
      lireOriginesAutorisees({ CORS_ORIGINS: 'https://exemple.dev/' }),
    ).toEqual(['https://exemple.dev']);
  });

  it('ignore les entrees vides', () => {
    expect(
      lireOriginesAutorisees({ CORS_ORIGINS: 'https://exemple.dev,, ' }),
    ).toEqual(['https://exemple.dev']);
  });

  it('refuse en production une liste absente', () => {
    expect(() => lireOriginesAutorisees({ NODE_ENV: 'production' })).toThrow(
      /CORS_ORIGINS/,
    );
  });

  it('refuse le joker, qui ouvrirait l API authentifiee a tout site', () => {
    expect(() => lireOriginesAutorisees({ CORS_ORIGINS: '*' })).toThrow(/\*/);
  });

  it('refuse une entree qui n est pas une origine http(s)', () => {
    expect(() =>
      lireOriginesAutorisees({ CORS_ORIGINS: 'exemple.dev' }),
    ).toThrow(/exemple\.dev/);
  });
});

describe('swaggerActif', () => {
  it('est actif en developpement', () => {
    expect(swaggerActif({})).toBe(true);
  });

  it('est coupe en production', () => {
    expect(swaggerActif({ NODE_ENV: 'production' })).toBe(false);
  });

  it('se rallume en production sur demande explicite', () => {
    expect(swaggerActif({ NODE_ENV: 'production', SWAGGER: 'true' })).toBe(
      true,
    );
  });
});
