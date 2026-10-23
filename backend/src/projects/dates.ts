type DatesRecues = { startDate?: string | null; endDate?: string | null };
type DatesPrisma = { startDate?: Date | null; endDate?: Date | null };

/**
 * Les dates du projet, telles que Prisma les accepte. Le DTO admet une date
 * seule (`2024-03-01`), forme qu'envoie le champ `type="date"` du backoffice,
 * mais Prisma refuse tout ce qui n'est pas un DateTime complet. Une cle
 * absente reste absente, pour qu'un PATCH partiel ne l'efface pas ; `null`
 * efface la date.
 */
export function datesDuProjet(dto: DatesRecues): DatesPrisma {
  const dates: DatesPrisma = {};
  for (const cle of ['startDate', 'endDate'] as const) {
    if (dto[cle] === undefined) continue;
    const v = dto[cle];
    dates[cle] = v === null ? null : new Date(v);
  }
  return dates;
}
