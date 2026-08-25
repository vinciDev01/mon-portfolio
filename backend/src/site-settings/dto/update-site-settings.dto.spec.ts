import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSiteSettingsDto } from './update-site-settings.dto';

async function erreursSur(champ: string, valeur: unknown): Promise<string[]> {
  const dto = plainToInstance(UpdateSiteSettingsDto, { [champ]: valeur });
  const erreurs = await validate(dto);
  return erreurs.map((e) => e.property);
}

describe('UpdateSiteSettingsDto', () => {
  it('refuse une saturation d accent au-dela de 30', async () => {
    expect(await erreursSur('accentSaturation', 80)).toContain('accentSaturation');
  });

  it('accepte une saturation d accent dans la plage', async () => {
    expect(await erreursSur('accentSaturation', 18)).toEqual([]);
  });

  it('refuse un assombrissement au-dela de 65', async () => {
    expect(await erreursSur('lampDimLevel', 90)).toContain('lampDimLevel');
  });

  it('refuse un interligne inferieur a 1.3', async () => {
    expect(await erreursSur('lineHeight', 0)).toContain('lineHeight');
  });

  it('refuse une vitesse d animation aberrante', async () => {
    expect(await erreursSur('animationSpeed', 50)).toContain('animationSpeed');
  });

  it('refuse une echelle typographique inconnue', async () => {
    expect(await erreursSur('typeScale', 'enorme')).toContain('typeScale');
  });

  it('accepte les trois echelles typographiques', async () => {
    for (const echelle of ['compact', 'normal', 'airy']) {
      expect(await erreursSur('typeScale', echelle)).toEqual([]);
    }
  });

  it('refuse une ouverture de faisceau hors plage', async () => {
    expect(await erreursSur('lampBeamAngle', 120)).toContain('lampBeamAngle');
  });
});
