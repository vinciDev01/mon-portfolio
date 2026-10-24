import type { BlogCategoryDto, BlogPostDto } from "@portfolio/shared-types";

/** Minuscules et sans accents : « Expérience » et « experience » se
 *  rejoignent, le visiteur n'a pas a deviner l'orthographe exacte. */
export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Les articles qui contiennent CHAQUE mot de la requete, ou qu'il soit : dans
 * le titre, le resume ou le contenu. Une requete vide ou blanche rend tout.
 * L'ordre recu est garde.
 */
export function filtrerArticles(articles: BlogPostDto[], requete: string): BlogPostDto[] {
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return articles;
  return articles.filter((a) => {
    const texte = normaliser(`${a.title} ${a.excerpt ?? ""} ${a.content}`);
    return mots.every((m) => texte.includes(m));
  });
}

export type Groupe = { categorie: BlogCategoryDto | null; articles: BlogPostDto[] };

/**
 * Les articles ranges par categorie : les groupes dans l'ordre `sortOrder`
 * des categories, departages par leur nom, et les articles sans categorie en
 * dernier. A l'interieur d'un groupe, l'ordre recu est garde. Aucun groupe
 * vide : une categorie sans article ne parait pas.
 */
export function grouperParCategorie(articles: BlogPostDto[]): Groupe[] {
  const groupes = new Map<string | null, Groupe>();
  for (const a of articles) {
    const cle = a.category?.id ?? null;
    const groupe = groupes.get(cle);
    if (groupe) groupe.articles.push(a);
    else groupes.set(cle, { categorie: a.category, articles: [a] });
  }
  return [...groupes.values()].sort((x, y) => {
    if (!x.categorie) return 1;
    if (!y.categorie) return -1;
    return (
      x.categorie.sortOrder - y.categorie.sortOrder ||
      x.categorie.name.localeCompare(y.categorie.name, "fr")
    );
  });
}
