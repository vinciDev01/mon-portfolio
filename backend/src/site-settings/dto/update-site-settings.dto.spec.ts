import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSiteSettingsDto } from './update-site-settings.dto';

async function erreursSur(champ: string, valeur: unknown): Promise<string[]> {
  const dto = plainToInstance(UpdateSiteSettingsDto, { [champ]: valeur });
  const erreurs = await validate(dto);
  return erreurs.map((e) => e.property);
}

describe('UpdateSiteSettingsDto', () => {
  describe('bornes numeriques', () => {
    it.each([
      // champ, valeur, doitPasser
      ['accentSaturation', 30, true],
      ['accentSaturation', 31, false],
      ['lampDimLevel', 65, true],
      ['lampDimLevel', 66, false],
      ['lampBeamAngle', 8, true],
      ['lampBeamAngle', 45, true],
      ['lampBeamAngle', 7, false],
      ['lampBeamAngle', 46, false],
      ['lineHeight', 1.3, true],
      ['lineHeight', 2.0, true],
      ['lineHeight', 1.29, false],
      ['lineHeight', 2.01, false],
      ['animationSpeed', 0.5, true],
      ['animationSpeed', 2.0, true],
      ['animationSpeed', 0.49, false],
      ['animationSpeed', 2.01, false],
      ['lampIntensity', 0, true],
      ['lampIntensity', 100, true],
      ['lampIntensity', -1, false],
      ['lampIntensity', 101, false],
      ['zigzagAmplitude', 0, true],
      ['zigzagAmplitude', 100, true],
      ['zigzagAmplitude', -1, false],
      ['zigzagAmplitude', 101, false],
      ['sectionSpacing', 64, true],
      ['sectionSpacing', 240, true],
      ['sectionSpacing', 63, false],
      ['sectionSpacing', 241, false],
      ['accentHue', 0, true],
      ['accentHue', 360, true],
      ['accentHue', -1, false],
      ['accentHue', 361, false],
    ])('%s = %s -> valide:%s', async (champ, valeur, doitPasser) => {
      const erreurs = await erreursSur(champ, valeur);
      if (doitPasser) {
        expect(erreurs).toEqual([]);
      } else {
        expect(erreurs).toContain(champ);
      }
    });
  });

  describe('typeScale', () => {
    it('refuse une echelle typographique inconnue', async () => {
      expect(await erreursSur('typeScale', 'enorme')).toContain('typeScale');
    });

    it('accepte les trois echelles typographiques', async () => {
      for (const echelle of ['compact', 'normal', 'airy']) {
        expect(await erreursSur('typeScale', echelle)).toEqual([]);
      }
    });
  });
});
