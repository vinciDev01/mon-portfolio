import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CoursService } from './cours.service';
import { RACINE_COURS } from './fichiers-cours';

const coursPublic = {
  id: 'c1',
  titre: 'Java, des bases aux objets',
  fichier: 'a.pdf',
  publique: true,
};

function service(cours: object | null) {
  const prisma = {
    cours: {
      findUnique: jest.fn().mockResolvedValue(cours),
      update: jest.fn().mockResolvedValue(cours),
    },
    $executeRaw: jest.fn().mockResolvedValue(1),
  };
  return { s: new CoursService(prisma as never), prisma };
}

function reponse() {
  return { set: jest.fn(), sendFile: jest.fn() };
}

describe('le telechargement d un cours', () => {
  it('refuse un cours masque, sans compter', async () => {
    const { s, prisma } = service({ ...coursPublic, publique: false });
    await expect(s.telecharger('c1', reponse() as never)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.cours.update).not.toHaveBeenCalled();
  });

  it('refuse un cours inconnu', async () => {
    const { s, prisma } = service(null);
    await expect(s.telecharger('x', reponse() as never)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.cours.update).not.toHaveBeenCalled();
  });

  it('compte puis envoie le PDF d un cours public, sous le nom de son titre', async () => {
    const { s, prisma } = service(coursPublic);
    const res = reponse();
    await s.telecharger('c1', res as never);
    // Le compteur avance en SQL brut : un `update` de Prisma toucherait
    // `updatedAt`, et la date « Mis a jour » du livre deviendrait celle du
    // dernier telechargement.
    expect(prisma.cours.update).not.toHaveBeenCalled();
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
    const [requete, ...valeurs] = prisma.$executeRaw.mock.calls[0] as [
      TemplateStringsArray,
      ...unknown[],
    ];
    expect(requete.join('?')).toMatch(
      /UPDATE\s+"?cours"?\s+SET\s+"?telechargements"?\s*=\s*"?telechargements"?\s*\+\s*1/i,
    );
    expect(requete.join('?')).not.toMatch(/updated_at/);
    expect(valeurs).toEqual(['c1']);
    expect(res.set).toHaveBeenCalledWith({
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'attachment; filename="Java_des_bases_aux_objets.pdf"',
    });
    const chemin = (res.sendFile.mock.calls as string[][])[0][0];
    expect(chemin).toBe(path.join(RACINE_COURS, 'a.pdf'));
    expect(chemin).not.toContain('uploads');
  });
});

describe('l envoi d un fichier de cours', () => {
  it('refuse ce qui n est pas un PDF, quel que soit son nom', async () => {
    const { s } = service(null);
    await expect(s.enregistrerFichier(Buffer.from('<html>'))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('range le PDF dans le dossier prive, rend nom, taille et pages, et sait l effacer', async () => {
    const { s } = service(null);
    const r = await s.enregistrerFichier(Buffer.from('%PDF-casse'));
    expect(r.fichier).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(r.taille).toBe(10);
    expect(r.pages).toBeNull();
    const chemin = path.join(RACINE_COURS, r.fichier);
    expect(fs.existsSync(chemin)).toBe(true);
    s.supprimerFichier(r.fichier);
    expect(fs.existsSync(chemin)).toBe(false);
  });

  it('n efface rien hors du dossier prive', () => {
    const { s } = service(null);
    // `path.basename` ramene tout nom dans le dossier : rien ne sort.
    expect(() => s.supprimerFichier('../package.json')).not.toThrow();
    expect(fs.existsSync(path.resolve(process.cwd(), 'package.json'))).toBe(
      true,
    );
  });
});
