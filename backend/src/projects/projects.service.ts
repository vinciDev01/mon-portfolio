import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const projectInclude = {
  technologies: {
    include: { technology: true },
  },
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      include: projectInclude,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });
    if (!record) throw new NotFoundException(`Project #${id} not found`);
    return record;
  }

  async create(dto: CreateProjectDto) {
    const { technologyIds, ...projectData } = dto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        technologies: technologyIds?.length
          ? {
              create: technologyIds.map((technologyId) => ({ technologyId })),
            }
          : undefined,
      },
      include: projectInclude,
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    const { technologyIds, ...projectData } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (technologyIds !== undefined) {
        await tx.projectTechnology.deleteMany({
          where: { projectId: id },
        });
      }

      return tx.project.update({
        where: { id },
        data: {
          ...projectData,
          technologies:
            technologyIds !== undefined
              ? {
                  create: technologyIds.map((technologyId) => ({ technologyId })),
                }
              : undefined,
        },
        include: projectInclude,
      });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.project.delete({ where: { id } });
  }
}
