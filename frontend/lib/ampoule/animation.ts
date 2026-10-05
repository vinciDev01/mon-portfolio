/**
 * Pilotage de la transition d'incandescence.
 *
 * Ronde de correction 1 (task-10-fix-1.md) : abandon d'une variable
 * unique de pilotage (derivee par couche via des rampes CSS bornees) au
 * profit d'une variable CSS par couche, toutes animees ENSEMBLE par le
 * meme et unique objet `Animation` — la reentrance (annexe §5.3) tient a
 * un seul objet, pas a une seule variable. Deux jeux d'images-cles
 * distincts, un par sens, recopies verbatim des deux tables de l'annexe.
 * La bascule entre les deux jeux ne se fait QU'AU REPOS sur une borne ;
 * en pleine transition, le jeu en cours est conserve et seule la cadence
 * est inversee (avec la correction d'asymetrie des durees).
 *
 * Ronde de correction 2 (task-10-fix-2.md) : les deux jeux ci-dessous
 * etaient incomplets — recopies des tableaux condenses du brief, pas de
 * l'annexe. Quatre manques combles ici :
 * 1. Les courbes `cubic-bezier`/mots-cles par phase (`easing` sur chaque
 *    entree de keyframe, gouvernant le segment qui PART de cette entree —
 *    convention WAAPI). Sans elles, toute la transition est lineaire.
 * 2. Les rampes chromatiques du filament a SIX arrets par sens (pas
 *    trois).
 * 3. Les six opacites intermediaires du filament a l'extinction (pas
 *    quatre) : 1,00 · 0,42 · 0,30 · 0,17 · 0,07 · 0,00.
 * 4. Une huitieme variable, `--t-brins`, pour le degrade de `stroke` des
 *    meridiens — fenetres distinctes de celles du filament (180->620 ms
 *    a l'allumage, 80->480 ms a l'extinction). Animee et testee ici ;
 *    consommee par quatre arrets de degrade `color-mix()` dans
 *    `components/ampoule/maille.tsx` (le degrade de `stroke` des meridiens).
 *
 * Point delicat, propre aux tableaux FUSIONNES ci-dessous : la Web
 * Animations API n'autorise qu'UN SEUL `easing` par objet de keyframe,
 * applique a TOUTES les proprietes qu'il porte. Quand deux proprietes
 * partagent le meme offset mais des courbes DIFFERENTES (ex. a
 * l'allumage, offset 0,0444 : `--t-filament` veut
 * `cubic-bezier(0.33, 0, 0.67, 0.35)` tandis que `--filament-couleur` n'a
 * aucune courbe specifiee), elles ne peuvent PAS partager le meme objet —
 * la WAAPI n'autorise que des offsets NON DECROISSANTS sur tout le
 * tableau (pas seulement par propriete, decouverte de la ronde 1), mais
 * elle autorise des offsets EGAUX repartis sur plusieurs objets
 * consecutifs. Ce fichier scinde donc systematiquement un offset partage
 * en plusieurs entrees des que les courbes divergent, et ne fusionne que
 * les proprietes qui partagent exactement la meme courbe (ou l'absence
 * de courbe) a cet offset.
 */

/** Duree de l'allumage (annexe §5.1). */
export const DUREE_ALLUMAGE = 900;
/** Duree de l'extinction (annexe §5.2) : plus lente, un filament
 *  refroidit plus lentement qu'il ne chauffe. */
export const DUREE_EXTINCTION = 1100;

/** Annule un allumage en cours : on recule dans IMAGES_ALLUMAGE (duree 900)
 *  en y passant les 1100 ms d'une extinction. */
const CADENCE_ANNULE_ALLUMAGE = -DUREE_ALLUMAGE / DUREE_EXTINCTION;
/** Annule une extinction en cours : on recule dans IMAGES_EXTINCTION
 *  (duree 1100) en y passant les 900 ms d'un allumage. */
const CADENCE_ANNULE_EXTINCTION = -DUREE_EXTINCTION / DUREE_ALLUMAGE;

/*
 * Les courbes de l'annexe, nommees par phase (task-10-fix-2.md). Plusieurs
 * phases distinctes partagent la meme courbe numerique — reprises comme
 * une seule constante reutilisee, jamais retapees, pour qu'un ecart de
 * frappe entre deux occurrences soit impossible.
 */
const EASE_PRECHAUFFAGE = "cubic-bezier(0.33, 0, 0.67, 0.35)";
const EASE_MONTEE = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_DEPASSEMENT = "cubic-bezier(0.34, 1.40, 0.64, 1)";
const EASE_REMPLISSAGE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** Rayonnement (halo) ET texture (moucheture) partagent cette courbe. */
const EASE_RAYONNEMENT_TEXTURE = "cubic-bezier(0.25, 1, 0.5, 1)";
/** `--t-page` est un PALIER, pas une rampe (addendum de la tache 12) :
 *  `steps(1, end)` maintient la valeur de depart jusqu'a la fin du
 *  segment, puis saute. Une rampe ferait passer la palette par le gris,
 *  texte et fond croisant a 1,10:1. */
const EASE_PALIER = "steps(1, end)";
const EASE_COUPURE = "cubic-bezier(0.4, 0, 1, 1)";
const EASE_ROUGEOIEMENT = "cubic-bezier(0.37, 0, 0.63, 1)";
const EASE_BRAISE = "cubic-bezier(0.4, 0, 0.85, 1)";
const EASE_LUEUR_EXTINCTION = "cubic-bezier(0.45, 0, 0.7, 0.3)";
/** Faisceau, halo et moucheture partagent cette courbe de depart. */
const EASE_DEPART_EXTINCTION = "cubic-bezier(0.5, 0, 0.9, 0.4)";

/**
 * Jeu d'images-cles de l'allumage (annexe §5.1, duree 900 ms, offsets =
 * ms / 900 — recopies tels quels depuis task-10-fix-2.md, courbes et
 * rampe chromatique a six arrets comprises). Voir la note de tete du
 * fichier pour la regle de fusion/scission des offsets partages.
 */
export const IMAGES_ALLUMAGE: Keyframe[] = [
  { offset: 0, "--t-page": 0, easing: EASE_PALIER }, // 0 ms : la page reste sombre jusqu'a 220 ms
  {
    offset: 0, // 0 ms : tout eteint, inertie
    "--t-filament": 0,
    "--t-lueur": 0,
    "--t-faisceau": 0,
    "--t-halo": 0,
    "--t-moucheture": 0,
    "--t-brins": 0,
    "--filament-couleur": "#3A3128", // arret initial : sans lui, la WAAPI interpole depuis la valeur sous-jacente (#FFFDF6 sous .clair)
  },
  { offset: 0.0444, "--t-filament": 0, easing: EASE_PRECHAUFFAGE }, // 40 ms : fin de l'inertie, debut du prechauffage
  { offset: 0.0444, "--filament-couleur": "#3A3128" }, // 40 ms : premier arret de la rampe chromatique
  { offset: 0.1444, "--t-filament": 0.45, "--t-lueur": 0, easing: EASE_MONTEE }, // 130 ms : fin du prechauffage, debut de la montee
  { offset: 0.1444, "--filament-couleur": "#A8431A" }, // 130 ms
  { offset: 0.2, "--t-brins": 0, easing: "ease-out" }, // 180 ms : debut du rechauffement des brins
  { offset: 0.2222, "--filament-couleur": "#E07A28" }, // 200 ms
  { offset: 0.2444, "--t-page": 1 }, // 220 ms : la piece s'eclaire d'un coup (palier)
  { offset: 0.2889, "--t-faisceau": 0, easing: EASE_REMPLISSAGE }, // 260 ms : debut du remplissage du faisceau
  { offset: 0.3333, "--filament-couleur": "#FFC169" }, // 300 ms
  { offset: 0.3556, "--t-halo": 0, easing: EASE_RAYONNEMENT_TEXTURE }, // 320 ms : debut du rayonnement
  { offset: 0.4222, "--t-filament": 1, easing: EASE_DEPASSEMENT }, // 380 ms : fin de la montee, debut du depassement
  { offset: 0.4444, "--t-moucheture": 0, easing: EASE_RAYONNEMENT_TEXTURE }, // 400 ms : debut de la texture
  { offset: 0.4667, "--t-lueur": 0.92, "--filament-couleur": "#FFF3D6" }, // 420 ms
  { offset: 0.5, "--t-filament": 1.08, easing: EASE_DEPASSEMENT }, // 450 ms : pic du depassement
  { offset: 0.5778, "--t-filament": 1, "--filament-couleur": "#FFFDF6" }, // 520 ms : fin du depassement, dernier arret de couleur
  { offset: 0.6222, "--t-faisceau": 1 }, // 560 ms : faisceau plein
  { offset: 0.6889, "--t-brins": 1 }, // 620 ms : brins pleinement chauds
  { offset: 0.7778, "--t-halo": 1 }, // 700 ms : halo plein
  { offset: 0.8667, "--t-moucheture": 0.55 }, // 780 ms : moucheture pleine
  {
    offset: 1, // 900 ms : tout allume
    "--t-filament": 1,
    "--t-lueur": 0.92,
    "--t-faisceau": 1,
    "--t-halo": 1,
    "--t-moucheture": 0.55,
    "--t-brins": 1,
    "--t-page": 1,
    "--filament-couleur": "#FFFDF6",
  },
];

/**
 * Jeu d'images-cles de l'extinction (annexe §5.2, duree 1100 ms, offsets
 * = ms / 1100 — recopies tels quels depuis task-10-fix-2.md). Ordre de
 * disparition : faisceau -> halo/moucheture -> lueur -> filament, PAS le
 * miroir de l'allumage (voir la note de tete du fichier). Six opacites
 * intermediaires pour le filament (et non quatre), six arrets pour sa
 * rampe chromatique (et non trois) : les manques de la premiere ronde.
 */
export const IMAGES_EXTINCTION: Keyframe[] = [
  { offset: 0, "--t-filament": 1, easing: EASE_COUPURE }, // 0 ms : coupure brutale de L1
  {
    offset: 0, // 0 ms : faisceau/halo/texture partent en premier
    "--t-faisceau": 1,
    "--t-halo": 1,
    "--t-moucheture": 0.55,
    easing: EASE_DEPART_EXTINCTION,
  },
  { offset: 0, "--t-page": 1, easing: EASE_PALIER }, // 0 ms : la page reste claire jusqu'a 460 ms
  { offset: 0, "--t-lueur": 0.92, "--t-brins": 1, "--filament-couleur": "#FFFDF6" }, // 0 ms
  { offset: 0.0545, "--t-lueur": 0.92, easing: EASE_LUEUR_EXTINCTION }, // 60 ms : fin du plateau initial de la lueur
  { offset: 0.0727, "--t-brins": 1, easing: "ease-in-out" }, // 80 ms : debut du refroidissement des brins
  { offset: 0.0818, "--t-filament": 0.42, easing: EASE_ROUGEOIEMENT }, // 90 ms : chute a 0,42
  { offset: 0.0818, "--filament-couleur": "#FFE3A8" }, // 90 ms
  { offset: 0.1818, "--t-filament": 0.3, easing: EASE_ROUGEOIEMENT }, // 200 ms : 0,30
  { offset: 0.1818, "--filament-couleur": "#FFB768" }, // 200 ms
  { offset: 0.2364, "--t-faisceau": 0 }, // 260 ms : faisceau eteint EN PREMIER
  { offset: 0.3091, "--t-filament": 0.17, easing: EASE_ROUGEOIEMENT }, // 340 ms : 0,17
  { offset: 0.3091, "--t-halo": 0, "--t-moucheture": 0, "--filament-couleur": "#E0631E" }, // 340 ms
  { offset: 0.3818, "--t-lueur": 0 }, // 420 ms : lueur eteinte
  { offset: 0.4182, "--t-page": 0 }, // 460 ms : la piece s'assombrit d'un coup (palier)
  { offset: 0.4364, "--t-brins": 0 }, // 480 ms : brins refroidis
  { offset: 0.5091, "--t-filament": 0.07, easing: EASE_BRAISE }, // 560 ms : 0,07, debut de la braise
  { offset: 0.5091, "--filament-couleur": "#7A2408" }, // 560 ms
  {
    offset: 1, // 1100 ms : braise eteinte
    "--t-filament": 0,
    "--t-lueur": 0,
    "--t-faisceau": 0,
    "--t-halo": 0,
    "--t-moucheture": 0,
    "--t-brins": 0,
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
 * Cree l'unique `Animation` qui pilote les huit variables sur `cible`
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

/** Duree de l'effet actuellement charge. */
function dureeChargee(animation: Animation): number {
  const effet = animation.effect as KeyframeEffect | null;
  const timing = effet?.getTiming();
  return typeof timing?.duration === "number" ? timing.duration : DUREE_ALLUMAGE;
}

/** Vrai si le jeu charge est IMAGES_ALLUMAGE (900) ; les deux durees
 *  etant distinctes, elle identifie le jeu sans drapeau separe. */
function jeuChargeEstAllumage(animation: Animation): boolean {
  return dureeChargee(animation) !== DUREE_EXTINCTION;
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
export function etatDeRepos(animation: Animation): { auRepos: boolean; allume: boolean } {
  const position = Number(animation.currentTime ?? NaN);
  if (!Number.isFinite(position)) {
    // Jamais positionnee : repli sur l'etat eteint, coherent avec la
    // valeur initiale de toutes les variables (@property, initial-value 0).
    return { auRepos: true, allume: false };
  }

  const duree = dureeChargee(animation);

  if (position > 0 && position < duree) {
    return { auRepos: false, allume: false };
  }

  const jeuAllumage = jeuChargeEstAllumage(animation);
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
 * d'inverser la cadence (avec la correction d'asymetrie) : les deux jeux
 * decrivent des configurations differentes au meme instant relatif — a
 * mi-allumage le faisceau est a 0,63, a mi-extinction il est deja a 0,
 * puisqu'il finit a 260 ms sur 1100. Basculer de jeu a chaud ferait donc
 * disparaitre le faisceau d'un coup. On obtient ainsi les deux tables
 * exactes sur tous les clics normaux, et un repli continu et coherent sur
 * le double clic rapide.
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
    // Chaque jeu se termine sur l'etat demande : la borne d'arrivee est
    // toujours `duree`, dans les deux sens (l'offset 0 de IMAGES_EXTINCTION
    // est l'etat ALLUME).
    animation.currentTime = duree;
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

  // En pleine transition : ne bascule NI le jeu NI la duree. Mais le SENS
  // depend du jeu charge : avancer mene a l'allume dans IMAGES_ALLUMAGE, a
  // l'eteint dans IMAGES_EXTINCTION.
  animation.playbackRate = jeuChargeEstAllumage(animation)
    ? versAllume
      ? 1
      : CADENCE_ANNULE_ALLUMAGE
    : versAllume
      ? CADENCE_ANNULE_EXTINCTION
      : 1;
  animation.play();
}
