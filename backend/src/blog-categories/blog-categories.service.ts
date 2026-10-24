import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogCategoryDto } from './dto/create-blog-category.dto';
import { UpdateBlogCategoryDto } from './dto/update-blog-category.dto';

/** Le nom d'une categorie est unique : Prisma leve P2002 sur un doublon, qui
 *  sans cela tomberait en 500. Le backoffice affiche ce message tel quel. */
function sansDoublon(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    throw new ConflictException('Une categorie porte deja ce nom');
  }
  throw e;
}

@Injectable()
export class BlogCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.blogCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`BlogCategory #${id} not found`);
    return record;
  }

  create(dto: CreateBlogCategoryDto) {
    return this.prisma.blogCategory.create({ data: dto }).catch(sansDoublon);
  }

  async update(id: string, dto: UpdateBlogCategoryDto) {
    await this.findOne(id);
    return this.prisma.blogCategory
      .update({ where: { id }, data: dto })
      .catch(sansDoublon);
  }

  /** Les articles de la categorie ne sont pas supprimes : la cle etrangere
   *  les detache (`onDelete: SetNull`), ils passent sous « Sans categorie ». */
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.blogCategory.delete({ where: { id } });
  }
}
