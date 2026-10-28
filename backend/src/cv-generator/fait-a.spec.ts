import { CvGeneratorService } from './cv-generator.service';
import { lignesFaitA, POINTILLES } from './contenu-cv';
import { versLaBase } from '../site-settings/site-settings.service';

const jour = new Date('2026-10-28T00:00:00.000Z');

describe('mention « Fait a ..., le ... »', () => {
  it('lieu et date saisis, sur deux lignes', () => {
    expect(
      lignesFaitA('Lomé', new Date('2026-11-02T00:00:00.000Z'), 'fr', jour),
    ).toEqual(['Fait à Lomé,', 'le 2 novembre 2026']);
  });

  it('sans lieu, des pointilles ; sans date, celle du jour', () => {
    expect(lignesFaitA('  ', null, 'fr', jour)).toEqual([
      `Fait à ${POINTILLES},`,
      'le 28 octobre 2026',
    ]);
  });

  it('en anglais', () => {
    expect(lignesFaitA('Lomé', null, 'en', jour)).toEqual([
      'Done at Lomé,',
      'on 28 October 2026',
    ]);
  });

  it('la date du backoffice, en date seule, devient une date complete ; le lieu vide devient nul', () => {
    expect(versLaBase({ cvDateFaitA: '2026-11-02', cvLieu: '  ' })).toEqual({
      cvDateFaitA: new Date('2026-11-02T00:00:00.000Z'),
      cvLieu: null,
    });
    expect(versLaBase({ cvDateFaitA: null })).toEqual({ cvDateFaitA: null });
    // Champs absents : rien n'est touche.
    expect(versLaBase({ cvFaitA: true })).toEqual({ cvFaitA: true });
  });
});

describe('la mention dans le CV', () => {
  const vide = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
  });
  const base = (reglages: Record<string, unknown>) => ({
    personalInfo: vide(),
    siteSettings: { findFirst: jest.fn().mockResolvedValue(reglages) },
    presentation: vide(),
    technology: vide(),
    certification: vide(),
    experience: vide(),
    project: vide(),
    cvSection: vide(),
    skill: vide(),
    cours: vide(),
  });
  type Collecte = {
    faitA: { lignes: [string, string]; espace: boolean } | null;
  };
  const collecter = (reglages: Record<string, unknown>) =>
    (
      new CvGeneratorService(base(reglages) as never) as unknown as {
        collecter: (b: undefined, l: 'fr' | 'en', v: null) => Promise<Collecte>;
      }
    ).collecter(undefined, 'fr', null);

  it('absente tant qu elle n est pas demandee', async () => {
    expect(
      (await collecter({ cvFaitA: false, cvLieu: 'Lomé' })).faitA,
    ).toBeNull();
  });

  it('presente avec le lieu, et le blanc de signature s il est demande', async () => {
    const { faitA } = await collecter({
      cvFaitA: true,
      cvLieu: 'Lomé',
      cvDateFaitA: jour,
      cvEspaceSignature: true,
    });
    expect(faitA).toEqual({
      lignes: ['Fait à Lomé,', 'le 28 octobre 2026'],
      espace: true,
    });
  });

  it('le PDF et le Word se generent avec la mention', async () => {
    const service = new CvGeneratorService(
      base({ cvFaitA: true, cvEspaceSignature: true }) as never,
    );
    expect(
      (await service.generatePdf()).contenu.subarray(0, 4).toString(),
    ).toBe('%PDF');
    expect(
      (await service.generateDocx()).contenu.subarray(0, 2).toString(),
    ).toBe('PK');
  }, 20_000);
});
