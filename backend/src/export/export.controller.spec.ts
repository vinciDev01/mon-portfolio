import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import {
  ExportController,
  TABLES_EXPORTEES,
  TABLES_HORS_EXPORT,
} from './export.controller';

/** Un faux Prisma : chaque table repond vide, et l'on note celles lues. */
function fauxPrisma(lues: Set<string>) {
  return new Proxy(
    {},
    {
      get: (_c, table: string) => {
        lues.add(table);
        return {
          findMany: () => Promise.resolve([]),
          findFirst: () => Promise.resolve(null),
        };
      },
    },
  ) as unknown as PrismaService;
}

describe('export des donnees', () => {
  it('chaque table est exportee, ou ecartee avec sa raison', () => {
    const oubliees = Object.values(Prisma.ModelName).filter(
      (m) => !(m in TABLES_EXPORTEES) && !(m in TABLES_HORS_EXPORT),
    );
    expect(oubliees).toEqual([]);
  });

  it('aucune table n est a la fois exportee et ecartee', () => {
    const deux = Object.keys(TABLES_EXPORTEES).filter(
      (m) => m in TABLES_HORS_EXPORT,
    );
    expect(deux).toEqual([]);
  });

  it('le fichier porte une cle par table exportee, et ne lit jamais les comptes', async () => {
    const lues = new Set<string>();
    const r = await new ExportController(fauxPrisma(lues)).exportData();
    expect(Object.keys(r).sort()).toEqual(
      ['meta', ...Object.values(TABLES_EXPORTEES)].sort(),
    );
    expect(lues.has('adminUser')).toBe(false);
  });
});
