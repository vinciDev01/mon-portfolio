import { PDFDocument } from 'pdf-lib';
import { compterPages, estUnPdf, nomDeTelechargement, RACINE_COURS } from './fichiers-cours';

describe('les fichiers de cours', () => {
  it('reconnait un PDF a sa signature, pas a son nom', () => {
    expect(estUnPdf(Buffer.from('%PDF-1.7\n...'))).toBe(true);
    expect(estUnPdf(Buffer.from('<html></html>'))).toBe(false);
    expect(estUnPdf(Buffer.from('%PD'))).toBe(false);
  });

  it('compte les pages d un PDF', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.addPage();
    doc.addPage();
    expect(await compterPages(Buffer.from(await doc.save()))).toBe(3);
  });

  it('rend null pour un PDF illisible, sans lever', async () => {
    expect(await compterPages(Buffer.from('%PDF-casse'))).toBeNull();
  });

  it('nomme le fichier telecharge d apres le titre, en ASCII', () => {
    expect(nomDeTelechargement('Java, des bases aux objets')).toBe('Java_des_bases_aux_objets.pdf');
    expect(nomDeTelechargement('Développement Flutter')).toBe('Developpement_Flutter.pdf');
    expect(nomDeTelechargement('  ')).toBe('cours.pdf');
  });

  it('range les cours hors du dossier servi en statique', () => {
    expect(RACINE_COURS.endsWith('/cours')).toBe(true);
    expect(RACINE_COURS).not.toContain('uploads');
  });
});
