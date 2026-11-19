import type { CvVersionDto } from "@portfolio/shared-types";

/** Une version a une lettre des qu'une section a du texte. */
export function aUneLettre(v: Pick<CvVersionDto, "lettreSections">): boolean {
  return v.lettreSections.some((s) => s.corps.trim().length > 0);
}
