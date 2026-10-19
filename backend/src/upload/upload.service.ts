import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { ecrireVariantes, nomVariante, taillesPour } from './variantes';

@Injectable()
export class UploadService {
  private readonly uploadsRoot: string;

  constructor() {
    this.uploadsRoot = path.resolve(process.cwd(), '..', 'uploads');
  }

  async uploadFile(
    file: Express.Multer.File,
    category: string,
  ): Promise<string> {
    const categoryDir = path.join(this.uploadsRoot, category);

    fs.mkdirSync(categoryDir, { recursive: true });

    const uuid = crypto.randomUUID();
    const isPdf = file.mimetype === 'application/pdf';
    const filename = isPdf ? `${uuid}.pdf` : `${uuid}.webp`;
    const outputPath = path.join(categoryDir, filename);

    try {
      if (isPdf) {
        fs.writeFileSync(outputPath, file.buffer);
      } else {
        await sharp(file.buffer).webp({ quality: 85 }).toFile(outputPath);

        // Les variantes de densité du médaillon, carrées et jamais agrandies.
        await ecrireVariantes(file.buffer, categoryDir, filename, category);
      }
    } catch (err) {
      // Nettoie le principal et toute variante possible ; l'erreur d'origine
      // est celle qui compte, un échec de suppression ne la remplace pas.
      this.supprimerAvecVariantes(path.join(category, filename));
      throw new InternalServerErrorException(
        `Failed to process file: ${(err as Error).message}`,
      );
    }

    return `${category}/${filename}`;
  }

  deleteFile(filePath: string): void {
    this.supprimerAvecVariantes(filePath);
  }

  /** Supprime le fichier et ses variantes ; une absence ou un échec est ignoré. */
  private supprimerAvecVariantes(filePath: string): void {
    const categorie = filePath.split(/[\\/]/)[0];
    const noms = [
      filePath,
      ...taillesPour(categorie).map((t) => nomVariante(filePath, t)),
    ];
    for (const nom of noms) {
      try {
        fs.rmSync(path.join(this.uploadsRoot, nom), { force: true });
      } catch {
        // ignoré volontairement
      }
    }
  }
}
