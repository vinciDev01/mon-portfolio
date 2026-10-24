import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TechnologyFamiliesService } from './technology-families.service';

/** Le doublon de nom tel que Prisma le leve sur l'index unique. */
const doublon = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });

function service(technologyFamily: Record<string, jest.Mock>) {
  return new TechnologyFamiliesService({ technologyFamily } as never);
}

describe('familles de technologies', () => {
  it('un nom deja pris donne un 409 lisible, pas un 500', async () => {
    const s = service({ create: jest.fn().mockRejectedValue(doublon()) });
    await expect(s.create({ name: 'Mobile' })).rejects.toThrow(ConflictException);
    await expect(s.create({ name: 'Mobile' })).rejects.toThrow(
      'Une famille porte deja ce nom',
    );
  });

  it('le renommage vers un nom pris donne aussi un 409', async () => {
    const s = service({
      findUnique: jest.fn().mockResolvedValue({ id: 'a' }),
      update: jest.fn().mockRejectedValue(doublon()),
    });
    await expect(s.update('a', { name: 'Mobile' })).rejects.toThrow(ConflictException);
  });

  it('une autre erreur remonte telle quelle', async () => {
    const autre = new Error('base injoignable');
    const s = service({ create: jest.fn().mockRejectedValue(autre) });
    await expect(s.create({ name: 'Mobile' })).rejects.toBe(autre);
  });

  it('liste les familles dans leur ordre, puis par nom', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    await service({ findMany }).findAll();
    expect(findMany).toHaveBeenCalledWith({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  });
});
