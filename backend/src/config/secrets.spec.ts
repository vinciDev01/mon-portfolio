import { lireSecretJwt, LONGUEUR_MINIMALE_SECRET } from './secrets';

// Assez long ET assez varie : un secret d'un seul caractere repete est
// rejete a raison, ce que verifie un test dedie plus bas.
const valide = 'aB3dE7gH1jK4mN8pQ2rS5tU9vW0xY6z'.padEnd(
  LONGUEUR_MINIMALE_SECRET,
  '!',
);

describe('lireSecretJwt', () => {
  it('rend le secret quand il est correctement defini', () => {
    expect(lireSecretJwt({ JWT_SECRET: valide })).toBe(valide);
  });

  it('refuse un secret absent', () => {
    expect(() => lireSecretJwt({})).toThrow(/JWT_SECRET/);
  });

  it('refuse un secret vide ou blanc', () => {
    expect(() => lireSecretJwt({ JWT_SECRET: '   ' })).toThrow(/JWT_SECRET/);
  });

  it('refuse un secret trop court pour resister', () => {
    expect(() => lireSecretJwt({ JWT_SECRET: 'court' })).toThrow(/32/);
  });

  it('refuse les valeurs de gabarit, meme assez longues', () => {
    expect(() =>
      lireSecretJwt({ JWT_SECRET: 'portfolio-secret-key-change-in-prod' }),
    ).toThrow(/gabarit/i);
    expect(() =>
      lireSecretJwt({ JWT_SECRET: 'change-me-change-me-change-me-change-me' }),
    ).toThrow(/gabarit/i);
  });

  it('n accepte pas un secret fait d un seul caractere repete', () => {
    expect(() => lireSecretJwt({ JWT_SECRET: 'a'.repeat(64) })).toThrow(
      /trop peu varie/i,
    );
  });

  it('accepte un secret genere aleatoirement', () => {
    const genere = 'k9Twz+Qm1aRb7Xv2Nf8Lc4Ph6Yd3Sj0EuIoAgVrKlM=';
    expect(lireSecretJwt({ JWT_SECRET: genere })).toBe(genere);
  });

  it('retire les blancs autour', () => {
    expect(lireSecretJwt({ JWT_SECRET: `  ${valide}  ` })).toBe(valide);
  });
});
