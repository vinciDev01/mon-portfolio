/**
 * Le script d'arrivee : actualiser la page sur une section ne montre plus
 * l'accueil.
 *
 * Le fragment (`#services`) n'arrive pas au serveur, qui active donc toujours
 * la section 0. Avant React, la page est un long document ; a l'actualisation
 * le navigateur restaure une position de defilement nulle (la page paginee ne
 * defile jamais), et l'accueil reste affiche jusqu'a l'hydratation, plusieurs
 * secondes en developpement.
 *
 * Ce script, rendu en ligne juste avant le parcours, s'execute pendant
 * l'analyse du HTML, donc avant toute peinture des sections. Si le fragment
 * designe une section du parcours autre que la premiere, il active la
 * pagination et injecte une feuille qui n'affiche que cette section. Le
 * conteneur, une fois la section reellement activee, retire le tout
 * (`leverArrivee`) et la pagination ordinaire reprend.
 *
 * Seuls les identifiants de la liste fournie sont acceptes : la feuille est
 * ecrite avec l'un d'eux, jamais avec le fragment brut.
 *
 * La colonne suit : l'entree que le serveur a marquee active reprend son style
 * de repos, celle de la section visee le style actif. Ses ATTRIBUTS ne sont pas
 * touches, React les hydrate tels que le serveur les a rendus ; seule la
 * feuille change, et ses valeurs recopient celles de `globals.css`, ce que
 * verifie un test. Ses selecteurs
 * l'emportent sur ceux de la pagination (`[data-active]`) par leur
 * specificite, sans compter sur l'ordre des couches CSS.
 */

export const ATTRIBUT_ARRIVEE = "data-arrivee";
const ID_FEUILLE = "style-arrivee";

/** Un identifiant de section sur dans un selecteur CSS et dans un script. */
const ID_SUR = /^[a-z0-9-]+$/;

export function scriptArrivee(ids: readonly string[]): string {
  const surs = ids.filter((id) => ID_SUR.test(id));
  return `(function(){try{
var ids=${JSON.stringify(surs)};
var id=location.hash.slice(1);
if(ids.indexOf(id)<1)return;
var r=document.documentElement;
r.setAttribute("data-pagination","active");
r.setAttribute(${JSON.stringify(ATTRIBUT_ARRIVEE)},id);
var f=document.createElement("style");
f.id=${JSON.stringify(ID_FEUILLE)};
var a="html[${ATTRIBUT_ARRIVEE}] .entree-parcours";
var v=a+'[href="#'+id+'"]';
f.textContent="html[${ATTRIBUT_ARRIVEE}] .parcours-pagine>.section-paginee{opacity:0;visibility:hidden;transition:none}"
+"html[${ATTRIBUT_ARRIVEE}] .parcours-pagine>#"+id+"{opacity:1;visibility:visible}"
+a+'[aria-current="true"]{color:var(--texte-secondaire)}'
+a+'[aria-current="true"] .picto-section>*{stroke-width:1.5}'
+a+'[aria-current="true"] .entree-nom{font-weight:inherit;text-decoration:none}'
+v+"{color:var(--texte)}"
+v+" .picto-section>*{stroke-width:2.75}"
+v+" .entree-nom{font-weight:600;text-decoration:underline dashed;text-decoration-thickness:1px;text-underline-offset:4px}";
document.head.appendChild(f);
}catch(_){}})()`;
}

/** Rend la main a la pagination ordinaire. Sans effet si le script n'a rien fait. */
export function leverArrivee(): void {
  document.documentElement.removeAttribute(ATTRIBUT_ARRIVEE);
  document.getElementById(ID_FEUILLE)?.remove();
}
