import { PortfolioService } from './portfolio.service';

describe('les cours dans le portfolio public', () => {
  it('ne livre que les cours publics, sans fichier, compteur ni visibilite', async () => {
    const liste = () => ({
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
    });
    const prisma: Record<string, ReturnType<typeof liste>> = {};
    for (const m of [
      'siteSettings',
      'personalInfo',
      'presentation',
      'skill',
      'experience',
      'certification',
      'project',
      'service',
      'about',
      'testimonial',
      'blogPost',
      'technology',
      'cours',
    ]) {
      prisma[m] = liste();
    }
    prisma.cours.findMany.mockResolvedValue([
      {
        id: 'c1',
        titre: 'Java',
        fichier: 'a.pdf',
        publique: true,
        telechargements: 7,
        technologyId: 't1',
        technology: { id: 't1' },
      },
    ]);
    const r = await new PortfolioService(prisma as never).getPortfolio();
    expect(prisma.cours.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { publique: true } }),
    );
    expect(r.cours).toHaveLength(1);
    for (const cle of [
      'fichier',
      'telechargements',
      'publique',
      'technologyId',
    ]) {
      expect(r.cours[0]).not.toHaveProperty(cle);
    }
  });
});
