import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

const projectInclude = {
  technologies: {
    include: { technology: true },
  },
  collaborators: {
    orderBy: { sortOrder: 'asc' as const },
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
    const { technologyIds, collaborators, ...projectData } = dto;

    return this.prisma.project.create({
      data: {
        ...projectData,
        technologies: technologyIds?.length
          ? {
              create: technologyIds.map((technologyId) => ({ technologyId })),
            }
          : undefined,
        collaborators: collaborators?.length
          ? { create: collaborators }
          : undefined,
      },
      include: projectInclude,
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    const { technologyIds, collaborators, ...projectData } = dto;

    return this.prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
      if (technologyIds !== undefined) {
        await tx.projectTechnology.deleteMany({
          where: { projectId: id },
        });
      }

      if (collaborators !== undefined) {
        await tx.projectCollaborator.deleteMany({
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
          collaborators:
            collaborators !== undefined
              ? { create: collaborators }
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
