import { datesDuProjet } from './dates';

/* Le DTO valide les dates par `@IsDateString`, qui accepte `2024-03-01`. Le
   formulaire du backoffice envoie exactement cette forme, et Prisma, lui,
   exige un DateTime complet : toute modification d'un projet date tombait en
   500, quel que soit le champ modifie. */
describe('dates du projet', () => {
  it('convertit une date seule en Date, a minuit UTC', () => {
    const d = datesDuProjet({ startDate: '2024-03-01', endDate: '2024-06-30' });
    expect(d.startDate).toEqual(new Date('2024-03-01T00:00:00.000Z'));
    expect(d.endDate).toEqual(new Date('2024-06-30T00:00:00.000Z'));
  });

  it('accepte aussi une date complete', () => {
    const d = datesDuProjet({ startDate: '2024-03-01T10:00:00.000Z' });
    expect(d.startDate).toEqual(new Date('2024-03-01T10:00:00.000Z'));
  });

  it('garde null, qui efface la date', () => {
    const d = datesDuProjet({ startDate: null, endDate: null });
    expect(d.startDate).toBeNull();
    expect(d.endDate).toBeNull();
  });

  it('laisse absente une date absente : un PATCH partiel n y touche pas', () => {
    const d = datesDuProjet({});
    expect('startDate' in d).toBe(false);
    expect('endDate' in d).toBe(false);
  });
});
