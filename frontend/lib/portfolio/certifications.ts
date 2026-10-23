import type { CertificationDto, OrganizationDto } from "@portfolio/shared-types";

export type Registre = { organisme: OrganizationDto; certifications: CertificationDto[] };

/**
 * Les certifications rangees par organisme, dans l'ordre ou chaque organisme
 * parait pour la premiere fois, et dans l'ordre recu a l'interieur d'un
 * organisme : celui du backoffice. Deux certifications d'un meme organisme se
 * lisent alors comme une progression (NSE 1, puis NSE 2).
 */
export function regrouperParOrganisme(certifications: CertificationDto[]): Registre[] {
  const registres = new Map<string, Registre>();
  for (const c of certifications) {
    const cle = c.organizationId;
    const registre = registres.get(cle);
    if (registre) registre.certifications.push(c);
    else registres.set(cle, { organisme: c.organization, certifications: [c] });
  }
  return [...registres.values()];
}

/** La premiere lettre des deux premiers mots : « Cisco Networking Academy »
 *  donne CN, « Oracle » donne O. */
export function initialesOrganisme(label: string): string {
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((mot) => mot.charAt(0))
    .join("")
    .toUpperCase();
}

/**
 * Le bord festonne du sceau, dans une boite de 64 x 64 centree en (32, 32) :
 * `dents` festons, chacun une courbe qui bombe vers l'exterieur entre deux
 * points du cercle interieur. Calcule et non dessine a la main, pour que le
 * nombre de dents reste un reglage.
 */
export function cheminSceau(dents = 18): string {
  const centre = 32;
  const creux = 27.5;
  const bosse = 31.5;
  const point = (r: number, a: number) =>
    `${(centre + r * Math.cos(a)).toFixed(2)} ${(centre + r * Math.sin(a)).toFixed(2)}`;
  const pas = (2 * Math.PI) / dents;
  let d = `M ${point(creux, -Math.PI / 2)}`;
  for (let i = 0; i < dents; i++) {
    const a = -Math.PI / 2 + i * pas;
    d += ` Q ${point(bosse, a + pas / 2)} ${point(creux, a + pas)}`;
  }
  return `${d} Z`;
}
