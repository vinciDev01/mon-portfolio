import { CLE_STOCKAGE, type Strategie } from "./regle-horaire";

/**
 * Script injecte dans <head> et execute AVANT le premier trace.
 *
 * Le serveur ignore l'heure locale du visiteur : calculer le theme au montage
 * produirait un basculement visible. Ce script pose la classe sur <html> avant
 * que quoi que ce soit ne soit peint, donc sans clignotement ni divergence
 * d'hydratation — React retrouve la classe deja en place.
 *
 * Il est volontairement ecrit en une seule expression, sans dependance, et
 * duplique la regle de `themeSelonHeure` : il ne peut pas importer de module.
 * Tout changement de seuil doit etre reporte aux deux endroits, ce que verifie
 * le test « le script applique la meme regle que la fonction ».
 */
export function scriptInitial(strategie: Strategie): string {
  return `(function(){try{
var s=${JSON.stringify(strategie)};
var c=localStorage.getItem(${JSON.stringify(CLE_STOCKAGE)});
var t=(c==="clair"||c==="sombre")?c
  :(s==="clair"||s==="sombre")?s
  :(function(){var h=new Date().getHours();return(h>=7&&h<19)?"sombre":"clair";})();
var e=document.documentElement;
e.classList.remove("clair","sombre");
e.classList.add(t);
e.style.colorScheme=(t==="clair")?"light":"dark";
}catch(_){document.documentElement.classList.add("sombre");}})()`;
}
