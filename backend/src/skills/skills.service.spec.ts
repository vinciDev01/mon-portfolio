import { BadRequestException } from '@nestjs/common';
import { SkillsService } from './skills.service';

/* Une competence est liee a une technologie, ou libre avec un nom : jamais
   les deux a moitie. */
describe('SkillsService', () => {
  const prisma = {
    skill: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      findUnique: jest.fn(),
    },
  };
  const service = new SkillsService(prisma as never);
  beforeEach(() => jest.clearAllMocks());

  it('liee a une technologie : nom et famille propres sont vides', async () => {
    const r = await service.create({ technologyId: 't1', label: 'ignore', familyId: 'f1', proficiency: 80 });
    expect(r).toMatchObject({ technologyId: 't1', label: null, familyId: null, proficiency: 80 });
  });

  it('libre : garde son nom (sans espaces autour) et sa famille', async () => {
    const r = await service.create({ label: '  Management ', familyId: 'f1' });
    expect(r).toMatchObject({ technologyId: null, label: 'Management', familyId: 'f1' });
  });

  it('ni technologie ni nom : refusee', () => {
    expect(() => service.create({ label: '   ' })).toThrow(BadRequestException);
    expect(() => service.create({})).toThrow(BadRequestException);
  });

  it('modification : passer d une technologie a une competence libre', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: 's', technologyId: 't1', label: null, familyId: null });
    const r = await service.update('s', { technologyId: null, label: 'Leadership', familyId: 'f2' });
    expect(r).toMatchObject({ technologyId: null, label: 'Leadership', familyId: 'f2' });
  });

  it('modification du seul niveau : les liens ne bougent pas', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: 's', technologyId: 't1', label: null, familyId: null });
    const r = await service.update('s', { proficiency: 60 });
    expect(r).toEqual({ proficiency: 60, sortOrder: undefined });
  });

  it('modification qui enleverait la technologie sans donner de nom : refusee', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: 's', technologyId: 't1', label: null, familyId: null });
    await expect(service.update('s', { technologyId: null })).rejects.toThrow(BadRequestException);
  });
});
