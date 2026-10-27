import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TechnologiesService } from './technologies.service';

describe('supprimer une technologie', () => {
  it('qui a des cours : refuse, avec un message lisible', async () => {
    const prisma = {
      technology: {
        findUnique: jest.fn().mockResolvedValue({ id: 't1' }),
        delete: jest.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError('Foreign key', {
            code: 'P2003',
            clientVersion: 'test',
          }),
        ),
      },
    };
    const s = new TechnologiesService(prisma as never);
    await expect(s.remove('t1')).rejects.toThrow(ConflictException);
    await expect(s.remove('t1')).rejects.toThrow(
      'Des cours utilisent cette technologie : deplacez-les ou supprimez-les d abord',
    );
  });
});
