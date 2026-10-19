import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProjectDto } from './create-project.dto';
import { UpdateProjectDto } from './update-project.dto';

/**
 * Les deux adresses d'un projet sont DISTINCTES et toutes deux validees :
 * `demoUrl` montre une demonstration, `projectUrl` est le projet lui-meme.
 *
 * Le point sensible n'est pas la validation mais le FILTRAGE : le
 * `ValidationPipe` de `main.ts` tourne avec `whitelist: true`, et le service
 * etale `...projectData` vers Prisma sans enumerer de champ. Une propriete
 * absente du DTO serait donc retiree en silence, et le backoffice croirait
 * avoir enregistre. Les tests de survie ci-dessous valent pour cela.
 */
async function erreursSur(
  classe: typeof CreateProjectDto | typeof UpdateProjectDto,
  corps: Record<string, unknown>,
): Promise<string[]> {
  const dto = plainToInstance(classe, corps);
  const erreurs = await validate(dto);
  return erreurs.map((e) => e.property);
}

/**
 * La VALEUR d'une propriete apres le filtrage, dans les conditions du pipe.
 *
 * Et non `Object.keys` : une classe TypeScript declare tous ses champs, donc
 * ils sont TOUS presents sur l'instance, a `undefined` quand le corps ne les
 * portait pas. Une garde ecrite sur les cles passerait donc meme pour un champ
 * jamais declare dans le DTO, mesure.
 */
async function apresFiltrage(
  classe: typeof CreateProjectDto | typeof UpdateProjectDto,
  corps: Record<string, unknown>,
  champ: string,
): Promise<unknown> {
  const dto = plainToInstance(classe, corps);
  await validate(dto, { whitelist: true });
  return (dto as unknown as Record<string, unknown>)[champ];
}

const BASE = { name: 'Un projet' };

describe('CreateProjectDto : les deux adresses', () => {
  it.each(['demoUrl', 'projectUrl'])(
    '%s accepte une adresse https et survit au filtrage',
    async (champ) => {
      const corps = { ...BASE, [champ]: 'https://exemple.test/x' };
      expect(await erreursSur(CreateProjectDto, corps)).toEqual([]);
      expect(await apresFiltrage(CreateProjectDto, corps, champ)).toBe(
        'https://exemple.test/x',
      );
    },
  );

  it.each(['demoUrl', 'projectUrl'])('%s refuse ce qui n est pas une adresse', async (champ) => {
    expect(await erreursSur(CreateProjectDto, { ...BASE, [champ]: 'pas une url' })).toContain(
      champ,
    );
  });

  it.each(['demoUrl', 'projectUrl'])('%s reste optionnel', async (champ) => {
    const corps = { ...BASE };
    expect(await erreursSur(CreateProjectDto, corps)).toEqual([]);
    expect(await apresFiltrage(CreateProjectDto, corps, champ)).toBeUndefined();
  });

  it('les deux adresses tiennent ensemble, et restent distinctes', async () => {
    const corps = {
      ...BASE,
      demoUrl: 'https://exemple.test/demo',
      projectUrl: 'https://exemple.test',
    };
    expect(await erreursSur(CreateProjectDto, corps)).toEqual([]);
    const dto = plainToInstance(CreateProjectDto, corps);
    await validate(dto, { whitelist: true });
    expect(dto.demoUrl).toBe('https://exemple.test/demo');
    expect(dto.projectUrl).toBe('https://exemple.test');
  });

  it('une propriete inconnue est bien retiree : le filtrage mord vraiment', async () => {
    // Sans cette ligne, les tests de survie ci-dessus ne prouveraient rien :
    // ils passeraient aussi avec un filtrage inerte.
    const corps = { ...BASE, siteWeb: 'https://exemple.test' };
    expect(await apresFiltrage(CreateProjectDto, corps, 'siteWeb')).toBeUndefined();
    // Et la MEME valeur, sur un champ declare, survit : sans cette moitie, le
    // test ci-dessus passerait aussi pour un filtrage qui tout retire.
    expect(
      await apresFiltrage(
        CreateProjectDto,
        { ...BASE, projectUrl: 'https://exemple.test' },
        'projectUrl',
      ),
    ).toBe('https://exemple.test');
  });
});

describe('UpdateProjectDto herite des deux adresses', () => {
  it.each(['demoUrl', 'projectUrl'])('%s survit a une mise a jour partielle', async (champ) => {
    const corps = { [champ]: 'https://exemple.test/x' };
    expect(await erreursSur(UpdateProjectDto, corps)).toEqual([]);
    expect(await apresFiltrage(UpdateProjectDto, corps, champ)).toBe('https://exemple.test/x');
  });
});
