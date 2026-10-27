/**
 * La recherche dans un long formulaire : masque les parametres dont le texte
 * ne correspond pas a la requete, sans que le formulaire ait a se decrire.
 *
 * Un parametre est le plus petit bloc qui entoure un champ sans en entourer
 * un autre : son libelle, son aide et les options de sa liste en font le
 * texte. Un bloc marque `data-param` compte pour un seul parametre, meme s'il
 * porte plusieurs champs (une image : le fichier et son URL).
 *
 * Un groupe est un enfant direct du formulaire. Si son titre (`h2`, `legend`)
 * correspond, tout le groupe reste visible ; sinon il ne garde que ses
 * parametres qui correspondent, et disparait s'il n'en garde aucun. Les blocs
 * sans champ (le bouton d'enregistrement) ne sont jamais masques.
 */

const CHAMPS = 'input:not([type="hidden"]), select, textarea';

/** Minuscules sans accents : « Thème » se trouve en tapant « theme ». */
export function normaliser(texte: string): string {
  return texte.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function texteDe(el: Element): string {
  const indices = [...el.querySelectorAll<HTMLInputElement>("[placeholder]")].map((c) => c.placeholder);
  return normaliser([el.textContent ?? "", ...indices].join(" "));
}

/** Tous les mots de la requete figurent-ils dans le texte ? */
function correspond(texte: string, mots: string[]): boolean {
  return mots.every((m) => texte.includes(m));
}

function parametresDe(groupe: Element): Element[] {
  // Un seul champ : le groupe est lui-meme le parametre.
  if (groupe.querySelectorAll(CHAMPS).length < 2) return [];
  const unites = new Set<Element>();
  if (groupe.hasAttribute("data-param")) return [];
  for (const champ of groupe.querySelectorAll(CHAMPS)) {
    const marque = champ.closest("[data-param]");
    if (marque && groupe.contains(marque) && marque !== groupe) {
      unites.add(marque);
      continue;
    }
    let u: Element = champ;
    while (u.parentElement && u.parentElement !== groupe && u.parentElement.querySelectorAll(CHAMPS).length === 1) {
      u = u.parentElement;
    }
    if (u !== groupe) unites.add(u);
  }
  return [...unites];
}

function montrer(el: Element, visible: boolean) {
  (el as HTMLElement).style.display = visible ? "" : "none";
}

/**
 * Applique la requete au formulaire et rend le nombre de parametres visibles.
 * Une requete vide remet tout en place.
 */
export function filtrerParametres(formulaire: HTMLElement, requete: string): number {
  const mots = normaliser(requete).split(/\s+/).filter(Boolean);
  let visibles = 0;
  for (const groupe of formulaire.children) {
    if (!groupe.querySelector(CHAMPS)) continue;
    const parametres = parametresDe(groupe);
    const titre = groupe.querySelector(":scope > h2, :scope > legend");
    const groupeEntier = mots.length === 0 || (titre !== null && correspond(texteDe(titre), mots));
    // Le groupe est lui-meme un parametre : un seul champ, ou un bloc marque.
    if (parametres.length === 0) {
      const ok = groupeEntier || correspond(texteDe(groupe), mots);
      montrer(groupe, ok);
      if (ok) visibles++;
      continue;
    }
    let garde = 0;
    for (const p of parametres) {
      const ok = groupeEntier || correspond(texteDe(p), mots);
      montrer(p, ok);
      if (ok) garde++;
    }
    montrer(groupe, garde > 0);
    visibles += garde;
  }
  return visibles;
}
