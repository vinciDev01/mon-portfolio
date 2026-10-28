/**
 * Associe a chaque technologie sans logo celui du catalogue qui porte son
 * nom (« Java » : openjdk). Une technologie qui a deja un logo, catalogue ou
 * image chargee, n'est pas touchee. Rejouable sans risque :
 *
 *   npx ts-node scripts/associer-logos.ts
 */
import { PrismaClient } from '@prisma/client';
import { correspondance } from '../src/logos/catalogue-logos';

async function main() {
  const prisma = new PrismaClient();
  try {
    const technos = await prisma.technology.findMany({ where: { logoSlug: null, logoPath: null } });
    const sansLogo: string[] = [];
    for (const t of technos) {
      const slug = correspondance(t.label);
      if (!slug) {
        sansLogo.push(t.label);
        continue;
      }
      await prisma.technology.update({ where: { id: t.id }, data: { logoSlug: slug } });
      console.log(`${t.label} -> ${slug}`);
    }
    if (sansLogo.length) console.log(`Sans correspondance : ${sansLogo.join(', ')}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
