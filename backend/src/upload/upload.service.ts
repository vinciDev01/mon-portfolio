import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly uploadsRoot: string;

  constructor() {
    this.uploadsRoot = path.resolve(__dirname, '..', '..', '..', 'uploads');
  }

  async uploadFile(
    file: Express.Multer.File,
    category: string,
  ): Promise<string> {
    const categoryDir = path.join(this.uploadsRoot, category);

    fs.mkdirSync(categoryDir, { recursive: true });

    const uuid = crypto.randomUUID();
    const filename = `${uuid}.webp`;
    const outputPath = path.join(categoryDir, filename);

    try {
      await sharp(file.buffer).webp({ quality: 85 }).toFile(outputPath);
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to process image: ${(err as Error).message}`,
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
