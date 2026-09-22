/**
 * Pilotage de la transition d'incandescence.
 *
 * Toutes les couches de lumiere (annexe §3, taches 7 a 9) lisent une
 * variable CSS unique, `--lampe-t` (enregistree par `@property` dans
 * globals.css, `<number>`, heritee — c'est ce qui la rend interpolable).
 * Cette variable est animee par un seul objet `Animation` de la Web
 * Animations API, cree par `creerAnimation` et pilote par
 * `basculerAnimation`.
 *
 * La cible de l'animation est `document.documentElement`, jamais
 * `.ampoule` : `body::before` (le halo de fond, L5, globals.css) n'est
 * pas un descendant de `.ampoule`, et une declaration `--lampe-t` posee
 * sur `.ampoule` l'emporterait de toute facon sur la valeur heritee pour
 * les couches qui, elles, sont a l'interieur du SVG (addendum du
 * controleur, tache 10, point A — c'est pour cela que les regles
 * `.ampoule { --lampe-t: 0 }` et `.clair .ampoule { --lampe-t: 1 }` ont
 * ete supprimees de globals.css : une animation prime sur une
 * declaration d'auteur, mais seulement sur l'element qu'elle cible et
 * ceux qui heritent reellement de lui).
 */

/** Duree de l'allumage : un filament met ~150 ms a atteindre sa couleur
 *  de regime, mais toute la mise en scene (annexe §5.1) occupe 900 ms. */
export const DUREE_ALLUMAGE = 900;

/** Duree de l'extinction : plus lente, un filament refroidit plus
 *  lentement qu'il ne chauffe (annexe §5.2). */
export const DUREE_EXTINCTION = 1100;

/**
 * Cadence a appliquer pour qu'une extinction jouee sur un `Animation` de
 * duree de base `DUREE_ALLUMAGE` dure malgre tout `DUREE_EXTINCTION`.
 * Negative : l'extinction remonte le temps vers `--lampe-t: 0`.
 */
const CADENCE_EXTINCTION = -DUREE_ALLUMAGE / DUREE_EXTINCTION;

/**
 * Vrai quand la mise en scene de la transition doit etre desactivee :
 * preference systeme de mouvement reduit active, ET le backoffice ne
 * force pas le mouvement.
 *
 * Necessaire en JavaScript et non en CSS (addendum du controleur, tache
 * 10, point C) : `--lampe-t` est pilotee par un objet `Animation` de la
 * Web Animations API, que les proprietes CSS `animation` et
 * `transition` ne controlent pas — un `@media (prefers-reduced-motion:
 * reduce) { .ampoule * { animation: none !important } }` n'aurait donc
 * strictement aucun effet sur elle, sans qu'aucune erreur ne le
 * signale.
 *
 * `data-mouvement="force"` reprend la convention deja en place dans ce
 * depot (globals.css, `:root:not([data-mouvement="force"])`) : le
 * backoffice peut passer outre la preference systeme du visiteur.
 */
export function mouvementReduit(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    document.documentElement.dataset.mouvement !== "force"
  );
}

/**
 * Cree l'unique `Animation` qui pilote `--lampe-t` sur `cible`
 * (`document.documentElement`). Sa duree de base est celle de
 * l'allumage ; l'extinction est obtenue en la jouant a rebours a une
 * cadence adaptee (voir `basculerAnimation`), jamais en creant un
 * second objet — c'est ce qui garantit la reentrance (annexe §5.3).
 *
 * Rendue en pause a la creation : c'est a l'appelant (le
 * `ThemeProvider`) de positionner `currentTime` selon l'etat initial
 * reel du theme avant de la relacher, pour ne jamais rejouer la mise en
 * scene au montage.
 */
export function creerAnimation(cible: HTMLElement): Animation {
  const animation = cible.animate([{ "--lampe-t": 0 }, { "--lampe-t": 1 }], {
    duration: DUREE_ALLUMAGE,
    fill: "both",
    easing: "linear",
  });
  animation.pause();
  return animation;
}

/**
 * Fait basculer `animation` vers l'etat allume (`versAllume: true`) ou
 * eteint (`versAllume: false`).
 *
 * Changer d'etat en pleine transition ne relance jamais l'animation
 * depuis le debut : on se contente de changer sa cadence, ce qui
 * conserve `currentTime` et fait repartir l'objet de sa position
 * courante. C'est ce qui garantit la reentrance — un double clic ne
 * peut jamais figer l'ampoule a mi-course, contrairement a une version
 * qui rappellerait `animate()` ou qui relancerait depuis 0.
 *
 * Deux pieges trouves au pre-vol (addendum du controleur, tache 10,
 * point B) sur la version naive qui appelait `animation.reverse()` :
 *
 * 1. `reverse()` se contente d'inverser le SIGNE de `playbackRate` en
 *    conservant sa valeur absolue. Une extinction declenchee en pleine
 *    allumage se jouerait donc a la cadence 1, soit 900 ms au lieu de
 *    1100 — l'asymetrie des durees serait perdue des qu'on change
 *    d'etat en cours de route. La cadence de l'extinction doit toujours
 *    etre recalculee explicitement a `-DUREE_ALLUMAGE / DUREE_EXTINCTION`.
 *
 * 2. `play()` se rembobine tout seul, par specification, quand la
 *    cadence est positive et `currentTime >= duree`, ou quand elle est
 *    negative et `currentTime <= 0`. Demander l'extinction alors que la
 *    lampe est deja eteinte ferait donc sauter l'animation a sa fin —
 *    un eclair a pleine lumiere avant de s'eteindre a nouveau.
 *    Symetriquement pour l'allumage. Le garde-fou ci-dessous evite tout
 *    appel a `play()` dans ces deux cas.
 */
export function basculerAnimation(animation: Animation, versAllume: boolean): void {
  if (mouvementReduit()) {
    // Le mouvement reduit est actif : pas de mise en scene, l'etat final
    // est pose directement. `pause()` avant d'ecrire `currentTime` fige
    // le rendu sur cette valeur — appeler `finish()` a la place serait
    // trompeur ici, puisque son resultat depend du SIGNE de
    // `playbackRate` (il porte `currentTime` a l'extremite vers laquelle
    // la cadence courante pointe, pas necessairement celle demandee par
    // `versAllume`), ce qui romprait exactement la meme facon que le
    // bug 2 ci-dessous si la cadence en place ne correspond pas au sens
    // demande.
    animation.pause();
    animation.currentTime = versAllume ? DUREE_ALLUMAGE : 0;
    return;
  }

  const position = Number(animation.currentTime ?? 0);
  const duree = DUREE_ALLUMAGE;
  if (versAllume && position >= duree) return;
  if (!versAllume && position <= 0) return;

  animation.playbackRate = versAllume ? 1 : CADENCE_EXTINCTION;
  animation.play();
}
