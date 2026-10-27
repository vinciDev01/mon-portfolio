import { grouperTechnologies } from './technologies-cv';
import { CvGeneratorService } from './cv-generator.service';

/** Une base vide, dont on observe la requete des technologies. */
function baseVide() {
  const vide = () => ({ findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null) });
  return {
    personalInfo: vide(),
    siteSettings: vide(),
    presentation: vide(),
    technology: vide(),
    certification: vide(),
    experience: vide(),
    project: vide(),
    cvSection: vide(),
    skill: vide(),
    cours: vide(),
  };
}

describe('les technologies du CV', () => {
  it('ne demande que celles marquees pour le CV, dans leur ordre', async () => {
    const prisma = baseVide();
    await new CvGeneratorService(prisma as never).generatePdf();
    expect(prisma.technology.findMany).toHaveBeenCalledWith({
      where: { showInCv: true },
      orderBy: { sortOrder: 'asc' },
      include: { family: true },
    });
  });

  it('ne reprend que les competences libres : les techniques sont deja dans TECHNOLOGIES', async () => {
    const prisma = baseVide();
    await new CvGeneratorService(prisma as never).generatePdf();
    expect(prisma.skill.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { technologyId: null } }));
    expect(prisma.cours.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { publique: true } }));
  });
});

describe('les technologies par famille', () => {
  const fam = (name: string, sortOrder = 0) => ({ name, sortOrder });
  const langages = fam('Langages', 0);
  const frameworks = fam('Frameworks', 1);
  const t = (label: string, family: { name: string; sortOrder: number } | null) => ({ label, family });

  it('une ligne par famille, dans l ordre des familles', () => {
    expect(
      grouperTechnologies([
        t('Spring Boot', frameworks),
        t('Java', langages),
        t('Angular', frameworks),
        t('Python', langages),
      ]),
    ).toEqual([
      { etiquette: 'Langages', valeur: 'Java, Python' },
      { etiquette: 'Frameworks', valeur: 'Spring Boot, Angular' },
    ]);
  });

  it('a ordre egal, departage par la premiere technologie de chaque famille', () => {
    expect(
      grouperTechnologies([t('Git', fam('Outils')), t('Java', fam('Langages'))]).map((p) => p.etiquette),
    ).toEqual(['Outils', 'Langages']);
  });

  it('range les technologies sans famille sous « Autres », en dernier', () => {
    expect(grouperTechnologies([t('Linux', null), t('Java', langages), t('Figma', null)])).toEqual([
      { etiquette: 'Langages', valeur: 'Java' },
      { etiquette: 'Autres', valeur: 'Linux, Figma' },
    ]);
  });

  it('sans aucune famille, garde une seule ligne sans etiquette', () => {
    expect(grouperTechnologies([t('Java', null), t('Git', null)])).toEqual([
      { etiquette: null, valeur: 'Java, Git' },
    ]);
  });

  it('ne rend rien sans technologie', () => {
    expect(grouperTechnologies([])).toEqual([]);
  });
});
