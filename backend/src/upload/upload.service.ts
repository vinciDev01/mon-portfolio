import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { taillesPour, nomVariante } from './variantes';

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

        // Les variantes de densité du médaillon. `withoutEnlargement` évite
        // d'agrandir une source trop petite : un agrandissement coûte des octets
        // sans ajouter un seul détail.
        for (const taille of taillesPour(category)) {
          await sharp(file.buffer)
            .resize(taille, taille, { fit: 'cover', withoutEnlargement: true })
            .webp({ quality: 82 })
            .toFile(path.join(categoryDir, nomVariante(filename, taille)));
        }
      }
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to process file: ${(err as Error).message}`,
      );
    }

    return `${category}/${filename}`;
  }

  deleteFile(filePath: string): void {
    const absolutePath = path.join(this.uploadsRoot, filePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }
}
