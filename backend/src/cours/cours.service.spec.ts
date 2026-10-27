import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CoursService, filtreRecherche } from './cours.service';
import { CreateCoursDto } from './dto/create-cours.dto';

const existant = {
  id: 'c1',
  fichier: '11111111-1111-1111-1111-111111111111.pdf',
};
const neuf = '22222222-2222-2222-2222-222222222222.pdf';

function service() {
  const prisma = {
    cours: {
      findUnique: jest.fn().mockResolvedValue(existant),
      update: jest.fn().mockResolvedValue(existant),
      delete: jest.fn().mockResolvedValue(existant),
    },
  };
  const s = new CoursService(prisma as never);
  const supprimer = jest
    .spyOn(s, 'supprimerFichier')
    .mockImplementation(() => undefined);
  return { s, prisma, supprimer };
}

describe('la gestion des cours', () => {
  it('remplacer le PDF efface l ancien fichier', async () => {
    const { s, supprimer } = service();
    await s.update('c1', { fichier: neuf, taille: 10 });
    expect(supprimer).toHaveBeenCalledWith(existant.fichier);
  });

  it('modifier sans changer de PDF n efface rien', async () => {
    const { s, supprimer } = service();
    await s.update('c1', { titre: 'Nouveau titre' });
    expect(supprimer).not.toHaveBeenCalled();
  });

  it('supprimer un cours supprime l enregistrement puis son fichier', async () => {
    const { s, prisma, supprimer } = service();
    await s.remove('c1');
    expect(prisma.cours.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(supprimer).toHaveBeenCalledWith(existant.fichier);
  });
});

describe('le DTO d un cours', () => {
  const valide = {
    titre: 'Java',
    niveau: 'debutant',
    fichier: neuf,
    taille: 10,
    technologyId: 't1',
  };
  const erreurs = async (o: object) =>
    (await validate(plainToInstance(CreateCoursDto, o))).map((e) => e.property);

  it('accepte un cours complet', async () => {
    expect(await erreurs(valide)).toEqual([]);
  });

  it('refuse un nom de fichier qui sortirait du dossier prive', async () => {
    expect(await erreurs({ ...valide, fichier: '../x.pdf' })).toContain(
      'fichier',
    );
  });

  it('refuse un niveau inconnu', async () => {
    expect(await erreurs({ ...valide, niveau: 'expert' })).toContain('niveau');
  });
});

describe('recherche des cours', () => {
  it('sans mot, aucun filtre', () => {
    expect(filtreRecherche(undefined)).toEqual({});
    expect(filtreRecherche('   ')).toEqual({});
  });

  it('chaque mot doit se trouver quelque part, sans egard a la casse', () => {
    const f = filtreRecherche(' java  objets ');
    expect(f.AND).toHaveLength(2);
    const premier = (f.AND as { OR: unknown[] }[])[0];
    expect(premier.OR).toEqual(
      expect.arrayContaining([
        { titre: { contains: 'java', mode: 'insensitive' } },
        { technology: { label: { contains: 'java', mode: 'insensitive' } } },
        { technology: { family: { name: { contains: 'java', mode: 'insensitive' } } } },
      ]),
    );
  });

  it('borne le nombre de mots', () => {
    expect((filtreRecherche('a b c d e f g h i j').AND as unknown[]).length).toBe(8);
  });
});
