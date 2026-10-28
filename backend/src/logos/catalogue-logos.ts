import * as fs from 'fs';
import * as path from 'path';

/**
 * Le catalogue des logos : Simple Icons (licence CC0), lu sur place dans le
 * paquet, jamais copie dans `uploads/`. Une technologie ne stocke que
 * l'identifiant de son logo (`openjdk`, `react`) ; le trace est lu ici a la
 * demande, puis garde en memoire.
 */

export type Logo = { slug: string; title: string; hex: string };
/** `exact` : le logo porte exactement le nom saisi, le choisir d'office est sur. */
export type LogoAvecTrace = Logo & { trace: string; exact: boolean };

type Entree = Logo & { cles: string[] };

/** Minuscules, sans accents ni ponctuation : « Next.js » et « nextjs » se
 *  retrouvent. Le « + » devient « plus » et le « # » « sharp », comme dans
 *  les identifiants de Simple Icons (C++, C#). */
export function cle(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Les noms courants qui ne sont pas le titre du logo : Java est publie sous
 * le nom d'OpenJDK (Oracle l'a fait retirer), HTML sous HTML5, Node sous
 * Node.js...
 */
const ALIAS: Record<string, string> = {
  java: 'openjdk',
  html: 'html5',
  css3: 'css',
  js: 'javascript',
  ts: 'typescript',
  node: 'nodedotjs',
  tailwind: 'tailwindcss',
  postgres: 'postgresql',
  golang: 'go',
};

let entrees: Entree[] | null = null;
let dossierIcones = '';
const traces = new Map<string, string | null>();

function charger(): Entree[] {
  if (entrees) return entrees;
  const fichier = require.resolve('simple-icons/icons.json');
  dossierIcones = path.join(path.dirname(path.dirname(fichier)), 'icons');
  const brut = JSON.parse(fs.readFileSync(fichier, 'utf8')) as {
    title: string;
    slug: string;
    hex: string;
    aliases?: { aka?: string[]; dup?: { title: string }[] };
  }[];
  entrees = brut.map((i) => ({
    slug: i.slug,
    title: i.title,
    hex: i.hex,
    cles: [
      cle(i.title),
      i.slug,
      ...(i.aliases?.aka ?? []).map(cle),
      ...(i.aliases?.dup ?? []).map((d) => cle(d.title)),
    ],
  }));
  return entrees;
}

/** Une technologie avec le trace et la couleur de marque de son logo, pour
 *  que le site et le backoffice le dessinent sans connaitre le catalogue. */
export function avecTrace<T extends { logoSlug: string | null }>(
  t: T,
): T & { logoTrace: string | null; logoHex: string | null } {
  const trace = traceDe(t.logoSlug);
  return { ...t, logoTrace: trace, logoHex: trace && t.logoSlug ? (logoDe(t.logoSlug)?.hex ?? null) : null };
}

/** Le logo d'un identifiant, s'il existe. */
export function logoDe(slug: string): Logo | null {
  const e = charger().find((x) => x.slug === slug);
  return e ? { slug: e.slug, title: e.title, hex: e.hex } : null;
}

/** Le trace SVG d'un logo, boite 24 x 24, ou null s'il n'existe pas. */
export function traceDe(slug: string | null | undefined): string | null {
  if (!slug || !/^[a-z0-9]+$/.test(slug)) return null;
  if (traces.has(slug)) return traces.get(slug)!;
  charger();
  let trace: string | null = null;
  try {
    const svg = fs.readFileSync(path.join(dossierIcones, `${slug}.svg`), 'utf8');
    trace = /<path d="([^"]+)"/.exec(svg)?.[1] ?? null;
  } catch {
    trace = null;
  }
  traces.set(slug, trace);
  return trace;
}

/**
 * Le logo qui correspond exactement au nom d'une technologie, ou null :
 * l'alias courant d'abord, puis le titre, l'identifiant et les autres noms
 * du logo. Sert a l'association automatique ; une correspondance douteuse
 * n'est jamais retenue.
 */
export function correspondance(label: string): string | null {
  const c = cle(label);
  if (!c) return null;
  const alias = ALIAS[c];
  if (alias && logoDe(alias)) return alias;
  const exacte = charger().find((e) => e.cles.includes(c));
  return exacte?.slug ?? null;
}

/**
 * Les logos dont le nom ressemble a la saisie, les plus proches d'abord :
 * correspondance exacte, puis debut de nom, puis nom qui la contient. Au
 * plus `limite`, avec leur trace pour l'apercu.
 */
export function rechercherLogos(saisie: string, limite = 12): LogoAvecTrace[] {
  const c = cle(saisie);
  if (!c) return [];
  const exact = correspondance(saisie);
  const notes = charger()
    .map((e) => {
      let note = 0;
      if (e.slug === exact) note = 4;
      else if (e.cles.includes(c)) note = 3;
      else if (e.cles.some((k) => k.startsWith(c))) note = 2;
      else if (e.cles.some((k) => k.includes(c))) note = 1;
      return { e, note };
    })
    .filter((x) => x.note > 0)
    .sort((a, b) => b.note - a.note || a.e.title.length - b.e.title.length || a.e.title.localeCompare(b.e.title));
  return notes
    .slice(0, limite)
    .map(({ e }) => ({ slug: e.slug, title: e.title, hex: e.hex, trace: traceDe(e.slug) ?? '', exact: e.slug === exact }))
    .filter((l) => l.trace);
}
