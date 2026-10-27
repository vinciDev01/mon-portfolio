import type { CoursPublicDto, TechnologyFamilyDto } from "@portfolio/shared-types";

/** Une planche de l'etagere : une famille et ses cours. `famille` nulle : la
 *  planche « Autres », des cours dont la technologie n'a pas de famille. */
export type Planche = { famille: TechnologyFamilyDto | null; cours: CoursPublicDto[] };

/**
 * Les cours ranges en planches : une par famille, dans l'ordre `sortOrder`
 * des familles puis leur nom, la planche « Autres » en dernier. Aucune
 * planche vide. Sur une planche, les livres suivent l'ordre du cours, puis
 * celui de sa technologie, puis le titre.
 */
export function rangerEnPlanches(cours: CoursPublicDto[]): Planche[] {
  const planches = new Map<string | null, Planche>();
  for (const c of cours) {
    const famille = c.technology.family ?? null;
    const cle = famille?.id ?? null;
    const planche = planches.get(cle);
    if (planche) planche.cours.push(c);
    else planches.set(cle, { famille, cours: [c] });
  }
  for (const p of planches.values()) {
    p.cours.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.technology.sortOrder - b.technology.sortOrder ||
        a.titre.localeCompare(b.titre, "fr"),
    );
  }
  return [...planches.values()].sort((x, y) => {
    if (!x.famille) return 1;
    if (!y.famille) return -1;
    return x.famille.sortOrder - y.famille.sortOrder || x.famille.name.localeCompare(y.famille.name, "fr");
  });
}

/** Le texte des tranches, dore pale : 4,5:1 au moins sur chaque cuir. */
const DORURE = "#f3ead7";

/**
 * Les cuirs des reliures, sourds, comme une bibliotheque ancienne : bordeaux,
 * vert foret, bleu nuit, ocre, prune, brun, ardoise. Des aplats, pas de
 * degrade, et chacun garde son texte lisible (teste).
 */
export const CUIRS: readonly { fond: string; texte: string }[] = [
  { fond: "#6b2f2a", texte: DORURE },
  { fond: "#2f4a3a", texte: DORURE },
  { fond: "#2f3a55", texte: DORURE },
  { fond: "#6e5220", texte: DORURE },
  { fond: "#4a2b44", texte: DORURE },
  { fond: "#5a3a2a", texte: DORURE },
  { fond: "#3a4448", texte: DORURE },
];

/** Le cuir d'une technologie, toujours le meme : tous les livres Java ont la
 *  meme reliure. Derive de l'identifiant par un hachage simple. */
export function cuirDe(technologyId: string): { fond: string; texte: string } {
  let h = 0;
  for (const c of technologyId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return CUIRS[h % CUIRS.length]!;
}

const UNITES: Record<string, { ko: string; mo: string }> = {
  fr: { ko: "Ko", mo: "Mo" },
  en: { ko: "KB", mo: "MB" },
  de: { ko: "KB", mo: "MB" },
};

/** « 2,4 Mo », « 600 Ko » : la taille d'un PDF, au format de la langue. */
export function tailleLisible(octets: number, locale: string): string {
  const u = UNITES[locale] ?? UNITES.fr!;
  const nombre = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const mo = octets / (1024 * 1024);
  return mo >= 1 ? `${nombre.format(mo)} ${u.mo}` : `${nombre.format(Math.round(octets / 1024))} ${u.ko}`;
}
