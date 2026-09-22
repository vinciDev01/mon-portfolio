/**
 * Pilotage de la transition d'incandescence.
 *
 * Ronde de correction 1 (task-10-fix-1.md) : la premiere version pilotait
 * toutes les couches depuis une seule variable `--lampe-t`, derivee par
 * couche via des rampes CSS bornees (`clamp(...calc...)`). Une seule
 * variable parcourue a rebours par le meme objet `Animation` ne peut
 * produire, pour l'extinction, que le MIROIR exact de l'ordre
 * d'apparition de l'allumage — or l'annexe (§5.1/§5.2) demande un ordre
 * de disparition qui n'est PAS ce miroir : le faisceau doit s'eteindre
 * en PREMIER (annexe : « c'est le detail qui vend l'effet »), alors que
 * le miroir de « filament -> lueur -> faisceau -> halo -> moucheture »
 * le ferait partir en troisieme.
 *
 * L'architecture retenue : une variable CSS par couche (`--t-filament`,
 * `--t-lueur`, `--t-faisceau`, `--t-halo`, `--t-moucheture`, `--t-page`,
 * plus `--filament-couleur` pour la rampe chromatique), toutes
 * enregistrees par `@property` dans globals.css (hors de tout `@layer`,
 * `inherits: true`), toutes animees ENSEMBLE par le meme et unique objet
 * `Animation` — la reentrance (annexe §5.3) reste garantie par un seul
 * objet, pas par une seule variable. Chaque couche CSS lit directement
 * sa propre variable (`opacity: var(--t-lueur)`, etc.), sans plus aucune
 * derivation par `calc()`/`clamp()`.
 *
 * Deux jeux d'images-cles distincts, un par sens, recopies verbatim des
 * deux tables de l'annexe (§5.1 pour l'allumage, §5.2 pour l'extinction)
 * — jamais deduits l'un de l'autre. C'est le seul moyen d'obtenir les
 * deux ordres, chacun exact au ms pres.
 */

/** Duree de l'allumage (annexe §5.1). */
export const DUREE_ALLUMAGE = 900;
/** Duree de l'extinction (annexe §5.2) : plus lente, un filament
 *  refroidit plus lentement qu'il ne chauffe. */
export const DUREE_EXTINCTION = 1100;

/**
 * Cadence a appliquer pour qu'une extinction jouee sur un jeu
 * d'images-cles de duree de base `DUREE_ALLUMAGE` (cas d'un changement
 * de sens en pleine transition, voir `basculerAnimation`) dure malgre
 * tout `DUREE_EXTINCTION`.
 */
const CADENCE_EXTINCTION = -DUREE_ALLUMAGE / DUREE_EXTINCTION;

/**
 * Jeu d'images-cles de l'allumage (annexe §5.1, duree 900 ms, offsets =
 * ms / 900 — recopies tels quels depuis task-10-fix-1.md). Les entrees
 * sont fusionnees et triees par offset global croissant, une seule
 * keyframe par offset partage : la Web Animations API exige que les
 * offsets explicites d'un tableau de keyframes soient non decroissants
 * sur TOUT le tableau, pas seulement par propriete — un groupement par
 * propriete (offsets remis a 0 a chaque groupe) leve un `TypeError` a
 * l'execution. Chaque propriete n'est neanmoins animee qu'aux offsets ou
 * elle apparait explicitement ci-dessous : la WAAPI calcule la courbe de
 * chaque propriete independamment, a partir du seul sous-ensemble de
 * keyframes qui la mentionne (« distributing keyframes for an individual
 * property » dans la specification).
 */
export const IMAGES_ALLUMAGE: Keyframe[] = [
  {
    offset: 0, // 0 ms : tout eteint
    "--t-filament": 0,
    "--t-lueur": 0,
    "--t-faisceau": 0,
    "--t-halo": 0,
    "--t-moucheture": 0,
    "--t-page": 0,
    "--filament-couleur": "#3A3128",
  },
  { offset: 0.0444, "--t-filament": 0 }, // 40 ms : fin de l'inertie
  {
    offset: 0.1444, // 130 ms : fin du prechauffage
    "--t-filament": 0.45,
    "--t-lueur": 0,
    "--filament-couleur": "#A8431A",
  },
  { offset: 0.2444, "--t-page": 0 }, // 220 ms : debut du fondu de page
  { offset: 0.2889, "--t-faisceau": 0 }, // 260 ms : debut du remplissage du faisceau
  { offset: 0.3556, "--t-halo": 0 }, // 320 ms : debut du rayonnement
  { offset: 0.4444, "--t-moucheture": 0 }, // 400 ms : debut de la texture
  {
    offset: 0.4667, // 420 ms : fin de la montee
    "--t-filament": 1,
    "--t-lueur": 0.92,
    "--filament-couleur": "#FFFDF6",
  },
  { offset: 0.5, "--t-filament": 1.08 }, // 450 ms : pic du depassement
  { offset: 0.5778, "--t-filament": 1 }, // 520 ms : fin du depassement
  { offset: 0.6222, "--t-faisceau": 1 }, // 560 ms : faisceau plein
  { offset: 0.6444, "--t-page": 1 }, // 580 ms : page pleinement claire
  { offset: 0.7778, "--t-halo": 1 }, // 700 ms : halo plein
  { offset: 0.8667, "--t-moucheture": 0.55 }, // 780 ms : moucheture pleine
  {
    offset: 1, // 900 ms : tout allume
    "--t-filament": 1,
    "--t-lueur": 0.92,
    "--t-faisceau": 1,
    "--t-halo": 1,
    "--t-moucheture": 0.55,
    "--t-page": 1,
    "--filament-couleur": "#FFFDF6",
  },
];

/**
 * Jeu d'images-cles de l'extinction (annexe §5.2, duree 1100 ms, offsets
 * = ms / 1100 — recopies tels quels depuis task-10-fix-1.md). Ordre de
 * disparition : faisceau -> halo/moucheture -> lueur -> filament, PAS le
 * miroir de l'allumage (voir la note de tete du fichier).
 */
export const IMAGES_EXTINCTION: Keyframe[] = [
  {
    offset: 0, // 0 ms : tout allume
    "--t-filament": 1,
    "--t-lueur": 0.92,
    "--t-faisceau": 1,
    "--t-halo": 1,
    "--t-moucheture": 0.55,
    "--t-page": 1,
    "--filament-couleur": "#FFFDF6",
  },
  { offset: 0.0545, "--t-lueur": 0.92, "--t-page": 1 }, // 60 ms : fin du plateau initial
  { offset: 0.0818, "--t-filament": 0.42, "--filament-couleur": "#FFFDF6" }, // 90 ms : coupure brutale de L1
  { offset: 0.2245, "--filament-couleur": "#FFB768" }, // 247 ms
  { offset: 0.2364, "--t-faisceau": 0 }, // 260 ms : faisceau eteint EN PREMIER
  { offset: 0.3091, "--t-halo": 0, "--t-moucheture": 0 }, // 340 ms : halo et texture eteints
  { offset: 0.3664, "--filament-couleur": "#E0631E" }, // 403 ms
  { offset: 0.3818, "--t-lueur": 0 }, // 420 ms : lueur eteinte
  { offset: 0.4182, "--t-page": 0 }, // 460 ms : page pleinement sombre
  { offset: 0.5091, "--t-filament": 0.07, "--filament-couleur": "#7A2408" }, // 560 ms : fin du rougeoiement
  {
    offset: 1, // 1100 ms : braise eteinte
    "--t-filament": 0,
    "--t-lueur": 0,
    "--t-faisceau": 0,
    "--t-halo": 0,
    "--t-moucheture": 0,
    "--t-page": 0,
    "--filament-couleur": "#3A3128",
  },
];

/**
 * Vrai quand la mise en scene de la transition doit etre desactivee :
 * preference systeme de mouvement reduit active, ET le backoffice ne
 * force pas le mouvement.
 *
 * Necessaire en JavaScript et non en CSS : `--t-*` sont pilotees par un
 * objet `Animation` de la Web Animations API, que les proprietes CSS
 * `animation` et `transition` ne controlent pas.
 *
 * `data-mouvement="force"` reprend la convention deja en place dans ce
 * depot (globals.css, `:root:not([data-mouvement="force"])`).
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
 * Cree l'unique `Animation` qui pilote les sept variables sur `cible`
 * (`document.documentElement` : `body::before`, L5, n'est pas un
 * descendant de `.ampoule`). Chargee avec le jeu de l'allumage par
 * defaut ; c'est sans consequence pour l'etat initial, puisque la fin de
 * `IMAGES_ALLUMAGE` (offset 1) et le debut de `IMAGES_EXTINCTION`
 * (offset 0) decrivent exactement la meme configuration « allume », et
 * inversement pour « eteint » (offset 0 de l'un, offset 1 de l'autre).
 *
 * Rendue en pause a la creation : c'est a l'appelant (le
 * `ThemeProvider`) de positionner `currentTime` selon l'etat initial
 * reel du theme avant de la relacher.
 */
export function creerAnimation(cible: HTMLElement): Animation {
  const animation = cible.animate(IMAGES_ALLUMAGE, {
    duration: DUREE_ALLUMAGE,
    fill: "both",
    easing: "linear",
  });
  animation.pause();
  return animation;
}

/** Remplace le jeu d'images-cles et la duree de `animation`, en place. */
function chargerJeu(animation: Animation, images: Keyframe[], duree: number): void {
  const effet = animation.effect as KeyframeEffect | null;
  effet?.setKeyframes(images);
  effet?.updateTiming({ duration: duree });
}

/**
 * Etat de repos de `animation` : vrai quand `currentTime` est exactement
 * sur une des deux bornes du jeu actuellement charge (ou que l'animation
 * n'a jamais ete positionnee), faux en pleine transition. `allume` n'a de
 * sens que si `auRepos` est vrai : il distingue laquelle des deux bornes
 * est occupee, en tenant compte du fait que les deux jeux ont une
 * semantique OPPOSEE (allumage : 0 = eteint, duree = allume ; extinction :
 * 0 = allume, duree = eteint) — d'ou la lecture de la duree actuellement
 * chargee (900 ou 1100, les deux constantes etant distinctes) pour savoir
 * quel jeu est en place, plutot que de maintenir un drapeau separe qui
 * pourrait diverger de l'etat reel de l'objet `Animation`.
 */
function etatDeRepos(animation: Animation): { auRepos: boolean; allume: boolean } {
  const position = Number(animation.currentTime ?? NaN);
  if (!Number.isFinite(position)) {
    // Jamais positionnee : repli sur l'etat eteint, coherent avec la
    // valeur initiale de toutes les variables (@property, initial-value 0).
    return { auRepos: true, allume: false };
  }

  const effet = animation.effect as KeyframeEffect | null;
  const timing = effet?.getTiming();
  const duree = typeof timing?.duration === "number" ? timing.duration : DUREE_ALLUMAGE;

  if (position > 0 && position < duree) {
    return { auRepos: false, allume: false };
  }

  const jeuAllumage = duree !== DUREE_EXTINCTION;
  const auDebut = position <= 0;
  return { auRepos: true, allume: jeuAllumage ? !auDebut : auDebut };
}

/**
 * Fait basculer `animation` vers l'etat allume (`versAllume: true`) ou
 * eteint (`versAllume: false`).
 *
 * Point delicat de la ronde de correction 1 : la bascule entre les deux
 * jeux d'images-cles ne se fait QU'AU REPOS sur une borne (clic normal).
 * En pleine transition, on garde le jeu en cours et on se contente
 * d'inverser la cadence (avec la correction d'asymetrie de la premiere
 * ronde) : les deux jeux decrivent des configurations differentes au
 * meme instant relatif — a mi-allumage le faisceau est a 0,63, a
 * mi-extinction il est deja a 0, puisqu'il finit a 260 ms sur 1100.
 * Basculer de jeu a chaud ferait donc disparaitre le faisceau d'un coup.
 * On obtient ainsi les deux tables exactes sur tous les clics normaux, et
 * un repli continu et coherent sur le double clic rapide — ce que la
 * garantie de reentrance (annexe §5.3) demande reellement : jamais d'etat
 * fige a mi-course, jamais d'incoherence visuelle.
 *
 * Les deux bugs de la ronde de correction 1 restent traites ici : pas de
 * `reverse()` qui perdrait l'asymetrie des durees, et un garde-fou qui
 * evite tout `play()` quand l'etat demande est deja celui de repos en
 * cours (la WAAPI rembobinerait sinon l'animation a sa fin).
 */
export function basculerAnimation(animation: Animation, versAllume: boolean): void {
  const images = versAllume ? IMAGES_ALLUMAGE : IMAGES_EXTINCTION;
  const duree = versAllume ? DUREE_ALLUMAGE : DUREE_EXTINCTION;

  if (mouvementReduit()) {
    // Pas de mise en scene : le jeu et la duree corrects sont charges
    // (pour que l'objet reste coherent au prochain clic non reduit), mais
    // `pause()` avant d'ecrire `currentTime` fige directement l'etat
    // final, sans jamais appeler `play()`.
    animation.pause();
    chargerJeu(animation, images, duree);
    animation.playbackRate = 1;
    animation.currentTime = versAllume ? duree : 0;
    return;
  }

  const { auRepos, allume } = etatDeRepos(animation);

  if (auRepos) {
    if (allume === versAllume) return; // deja dans l'etat demande : rien a faire.

    chargerJeu(animation, images, duree);
    animation.playbackRate = 1;
    animation.currentTime = 0;
    animation.play();
    return;
  }

  // En pleine transition : ne bascule NI le jeu NI la duree.
  animation.playbackRate = versAllume ? 1 : CADENCE_EXTINCTION;
  animation.play();
}
