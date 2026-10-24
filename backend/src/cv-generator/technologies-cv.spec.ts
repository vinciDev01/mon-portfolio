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
  };
}

describe('les technologies du CV', () => {
  it('ne demande que celles marquees pour le CV, dans leur ordre', async () => {
    const prisma = baseVide();
    await new CvGeneratorService(prisma as never).generatePdf();
    expect(prisma.technology.findMany).toHaveBeenCalledWith({
      where: { showInCv: true },
      orderBy: { sortOrder: 'asc' },
    });
  });
});

describe('les technologies par famille', () => {
  const t = (label: string, family: string | null) => ({ label, family });

  it('une ligne par famille, dans l ordre de la premiere technologie de chacune', () => {
    expect(
      grouperTechnologies([
        t('Java', 'Langages'),
        t('Spring Boot', 'Frameworks'),
        t('Python', 'Langages'),
        t('Angular', 'Frameworks'),
      ]),
    ).toEqual([
      { etiquette: 'Langages', valeur: 'Java, Python' },
      { etiquette: 'Frameworks', valeur: 'Spring Boot, Angular' },
    ]);
  });

  it('confond les familles a la casse et aux blancs pres, et garde la premiere graphie', () => {
    expect(
      grouperTechnologies([t('Git', 'Outils'), t('Docker', ' outils ')]),
    ).toEqual([{ etiquette: 'Outils', valeur: 'Git, Docker' }]);
  });

  it('range les technologies sans famille sous « Autres », en dernier', () => {
    expect(
      grouperTechnologies([t('Linux', null), t('Java', 'Langages'), t('Figma', '  ')]),
    ).toEqual([
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
