import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DUREE_ALLUMAGE,
  DUREE_EXTINCTION,
  IMAGES_ALLUMAGE,
  IMAGES_EXTINCTION,
  basculerAnimation,
  creerAnimation,
  mouvementReduit,
} from "./animation";

/**
 * Double factice d'un `Animation` de la Web Animations API, `effect`
 * (`KeyframeEffect`) compris : `basculerAnimation` (ronde de correction 1)
 * a besoin de `effect.setKeyframes`/`updateTiming`/`getTiming` en plus de
 * `currentTime`/`playbackRate`/`play`/`pause`. L'environnement de test est
 * "node" (vitest.config.ts, modules purs sans DOM) : `Animation` n'existe
 * pas reellement, d'ou le `as unknown as Animation`.
 *
 * `getTiming()` reflete la duree effectivement posee par le dernier
 * `updateTiming()`, exactement comme le ferait un vrai `KeyframeEffect` :
 * c'est sur cette duree que `basculerAnimation` s'appuie pour determiner
 * quel jeu (allumage ou extinction) est actuellement charge.
 */
function animationFactice(currentTime: number, playbackRate = 1, dureeInitiale = DUREE_ALLUMAGE) {
  let duree = dureeInitiale;
  const effect = {
    setKeyframes: vi.fn(),
    updateTiming: vi.fn((options?: { duration?: number }) => {
      if (options && typeof options.duration === "number") duree = options.duration;
    }),
    getTiming: vi.fn(() => ({ duration: duree })),
  };
  const anim = {
    currentTime,
    playbackRate,
    effect,
    play: vi.fn(),
    pause: vi.fn(),
  };
  return anim as unknown as Animation & {
    effect: typeof effect;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
  };
}

describe("basculerAnimation, bug 1 de la ronde de correction 1 (cadence perdue par reverse)", () => {
  it("garde la cadence -900/1100 quand l extinction est declenchee a mi-allumage", () => {
    // Position strictement interieure a la duree du jeu charge (900) :
    // ni au debut ni a la fin, donc en pleine transition.
    const anim = animationFactice(450, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, false);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
    expect(anim.playbackRate).not.toBe(-1);
    expect(anim.play).toHaveBeenCalledTimes(1);
    // En pleine transition, on ne bascule ni le jeu ni la duree (voir la
    // description "en pleine transition" plus bas).
    expect(anim.effect.setKeyframes).not.toHaveBeenCalled();
    expect(anim.effect.updateTiming).not.toHaveBeenCalled();
  });

  /*
   * PREMISSE A RESPECTER : au repos, le code reel charge TOUJOURS la
   * cadence 1 (voir basculerAnimation, branche "auRepos"). Un double
   * « jeu d'extinction + cadence negative » est un etat que le code ne
   * produit jamais ; l'ancien test en fabriquait un et masquait ainsi le
   * defaut ou la cadence ignorait le jeu charge. Les quatre cas ci-dessous
   * sont les seuls reellement atteignables en pleine transition.
   */
  it("jeu d extinction, cadence 1, position 500, demande allume : recule a -1100/900", () => {
    const anim = animationFactice(500, 1, DUREE_EXTINCTION);
    basculerAnimation(anim, true);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_EXTINCTION / DUREE_ALLUMAGE, 6);
    expect(anim.play).toHaveBeenCalledTimes(1);
    expect(anim.effect.setKeyframes).not.toHaveBeenCalled();
  });

  it("jeu d extinction, cadence 1, position 500, demande eteint : cadence 1, aucune inversion", () => {
    const anim = animationFactice(500, 1, DUREE_EXTINCTION);
    basculerAnimation(anim, false);
    expect(anim.playbackRate).toBe(1);
  });

  it("jeu d allumage, cadence 1, position 400, demande eteint : recule a -900/1100", () => {
    const anim = animationFactice(400, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, false);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
  });

  it("jeu d allumage, cadence 1, position 400, demande allume : cadence 1", () => {
    const anim = animationFactice(400, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, true);
    expect(anim.playbackRate).toBe(1);
  });
});

describe("basculerAnimation, bug 2 de la ronde de correction 1 (play() se rembobine tout seul)", () => {
  it("ne declenche aucun play() si l extinction est demandee alors que la lampe est deja eteinte", () => {
    // Au repos, jeu d'allumage charge, position 0 : etat eteint.
    const anim = animationFactice(0, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, false);
    expect(anim.play).not.toHaveBeenCalled();
    expect(anim.effect.setKeyframes).not.toHaveBeenCalled();
  });

  it("ne declenche aucun play() si l allumage est demande alors que la lampe est deja allumee", () => {
    // Au repos, jeu d'allumage charge, position en fin de course : allume.
    const anim = animationFactice(DUREE_ALLUMAGE, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, true);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("ne declenche aucun play() si l extinction est demandee alors que le jeu d extinction est deja fini (position 1100, allume=false)", () => {
    const anim = animationFactice(DUREE_EXTINCTION, 1, DUREE_EXTINCTION);
    basculerAnimation(anim, false);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("tolere un currentTime au-dela de la duree (arrondi flottant) sans jamais rejouer au-dela", () => {
    const anim = animationFactice(DUREE_ALLUMAGE + 0.5, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, true);
    expect(anim.play).not.toHaveBeenCalled();
  });
});

describe("basculerAnimation, bascule de jeu au repos (ronde de correction 1, test 1)", () => {
  it("au repos et eteinte, une demande d allumage installe IMAGES_ALLUMAGE et une duree de 900", () => {
    const anim = animationFactice(0, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, true);
    expect(anim.effect.setKeyframes).toHaveBeenCalledExactlyOnceWith(IMAGES_ALLUMAGE);
    expect(anim.effect.updateTiming).toHaveBeenCalledExactlyOnceWith({ duration: DUREE_ALLUMAGE });
    expect(anim.playbackRate).toBe(1);
    expect(anim.currentTime).toBe(0);
    expect(anim.play).toHaveBeenCalledTimes(1);
  });

  it("au repos et allumee, une demande d extinction installe IMAGES_EXTINCTION et une duree de 1100", () => {
    const anim = animationFactice(DUREE_ALLUMAGE, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, false);
    expect(anim.effect.setKeyframes).toHaveBeenCalledExactlyOnceWith(IMAGES_EXTINCTION);
    expect(anim.effect.updateTiming).toHaveBeenCalledExactlyOnceWith({ duration: DUREE_EXTINCTION });
    expect(anim.currentTime).toBe(0);
    expect(anim.play).toHaveBeenCalledTimes(1);
  });

  it("au repos sur la fin du jeu d extinction (eteinte), une demande d allumage revient a IMAGES_ALLUMAGE / 900", () => {
    const anim = animationFactice(DUREE_EXTINCTION, 1, DUREE_EXTINCTION);
    basculerAnimation(anim, true);
    expect(anim.effect.setKeyframes).toHaveBeenCalledExactlyOnceWith(IMAGES_ALLUMAGE);
    expect(anim.effect.updateTiming).toHaveBeenCalledExactlyOnceWith({ duration: DUREE_ALLUMAGE });
  });
});

describe("basculerAnimation, aucune bascule de jeu en pleine transition (ronde de correction 1, test 2)", () => {
  it("n appelle ni setKeyframes ni updateTiming quand la position est strictement interieure aux bornes", () => {
    const anim = animationFactice(1, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, false);
    expect(anim.effect.setKeyframes).not.toHaveBeenCalled();
    expect(anim.effect.updateTiming).not.toHaveBeenCalled();
    expect(anim.play).toHaveBeenCalledTimes(1);
  });

  it("n appelle ni setKeyframes ni updateTiming meme au milieu exact d une extinction en cours", () => {
    const anim = animationFactice(550, -DUREE_ALLUMAGE / DUREE_EXTINCTION, DUREE_EXTINCTION);
    basculerAnimation(anim, true);
    expect(anim.effect.setKeyframes).not.toHaveBeenCalled();
    expect(anim.effect.updateTiming).not.toHaveBeenCalled();
  });
});

/**
 * Fusionne toutes les entrees de `jeu` qui partagent l'offset donne en un
 * seul objet propriete -> valeur. Necessaire depuis la ronde de
 * correction 2 : un offset partage par plusieurs proprietes aux courbes
 * DIFFERENTES est scinde en plusieurs objets de keyframe consecutifs (la
 * WAAPI n'autorise qu'un seul `easing` par objet) — un offset donne n'est
 * donc plus forcement porte par une seule entree du tableau.
 */
function valeursAOffset(jeu: Keyframe[], offset: number): Record<string, unknown> {
  const fusion: Record<string, unknown> = {};
  for (const image of jeu) {
    if (Number(image.offset) !== offset) continue;
    for (const [cle, valeur] of Object.entries(image)) {
      if (cle === "offset" || cle === "easing") continue;
      fusion[cle] = valeur;
    }
  }
  return fusion;
}

const VARIABLES_NUMERIQUES = [
  "--t-filament",
  "--t-lueur",
  "--t-faisceau",
  "--t-halo",
  "--t-moucheture",
  "--t-brins",
  "--t-page",
] as const;

describe("IMAGES_ALLUMAGE / IMAGES_EXTINCTION, offsets (ronde de correction 1, test 3)", () => {
  it("sont non decroissants sur l ensemble du tableau (exigence de la WAAPI, ronde de correction 2 : des offsets EGAUX sont admis quand les courbes divergent)", () => {
    for (const jeu of [IMAGES_ALLUMAGE, IMAGES_EXTINCTION]) {
      for (let i = 1; i < jeu.length; i++) {
        expect(Number(jeu[i].offset)).toBeGreaterThanOrEqual(Number(jeu[i - 1].offset));
      }
    }
  });

  it("sont tous bornes a [0, 1], premier offset 0 et dernier offset 1", () => {
    for (const jeu of [IMAGES_ALLUMAGE, IMAGES_EXTINCTION]) {
      expect(Number(jeu[0].offset)).toBe(0);
      expect(Number(jeu[jeu.length - 1].offset)).toBe(1);
      for (const image of jeu) {
        const o = Number(image.offset);
        expect(o).toBeGreaterThanOrEqual(0);
        expect(o).toBeLessThanOrEqual(1);
      }
    }
  });

  it("definissent les huit variables au dernier offset", () => {
    const variables = [...VARIABLES_NUMERIQUES, "--filament-couleur"];
    for (const jeu of [IMAGES_ALLUMAGE, IMAGES_EXTINCTION]) {
      const fin = valeursAOffset(jeu, 1);
      for (const v of variables) {
        expect(fin).toHaveProperty(v);
      }
    }
  });

  it("se rejoignent aux deux bornes : fin de l un = debut de l autre, une fois les offsets partages fusionnes", () => {
    const finAllumage = valeursAOffset(IMAGES_ALLUMAGE, 1);
    const debutExtinction = valeursAOffset(IMAGES_EXTINCTION, 0);
    const finExtinction = valeursAOffset(IMAGES_EXTINCTION, 1);
    const debutAllumage = valeursAOffset(IMAGES_ALLUMAGE, 0);
    for (const v of [...VARIABLES_NUMERIQUES, "--filament-couleur"]) {
      expect(finAllumage[v]).toBe(debutExtinction[v]);
    }
    for (const v of [...VARIABLES_NUMERIQUES, "--filament-couleur"]) {
      expect(finExtinction[v]).toBe(debutAllumage[v]);
    }
  });
});

describe("courbes d acceleration (ronde de correction 2, test 1)", () => {
  it("porte l easing de chaque phase de l annexe, chaine exacte, au bon offset", () => {
    const attendus: Array<[Keyframe[], number, string, string]> = [
      [IMAGES_ALLUMAGE, 0.0444, "--t-filament", "cubic-bezier(0.33, 0, 0.67, 0.35)"],
      [IMAGES_ALLUMAGE, 0.1444, "--t-filament", "cubic-bezier(0.22, 1, 0.36, 1)"],
      [IMAGES_ALLUMAGE, 0.1444, "--t-lueur", "cubic-bezier(0.22, 1, 0.36, 1)"],
      [IMAGES_ALLUMAGE, 0.4222, "--t-filament", "cubic-bezier(0.34, 1.40, 0.64, 1)"],
      [IMAGES_ALLUMAGE, 0.5, "--t-filament", "cubic-bezier(0.34, 1.40, 0.64, 1)"],
      [IMAGES_ALLUMAGE, 0.2889, "--t-faisceau", "cubic-bezier(0.33, 1, 0.68, 1)"],
      [IMAGES_ALLUMAGE, 0.3556, "--t-halo", "cubic-bezier(0.25, 1, 0.5, 1)"],
      [IMAGES_ALLUMAGE, 0.4444, "--t-moucheture", "cubic-bezier(0.25, 1, 0.5, 1)"],
      [IMAGES_ALLUMAGE, 0.2, "--t-brins", "ease-out"],
      [IMAGES_ALLUMAGE, 0, "--t-page", "steps(1, end)"],
      [IMAGES_EXTINCTION, 0, "--t-filament", "cubic-bezier(0.4, 0, 1, 1)"],
      [IMAGES_EXTINCTION, 0, "--t-faisceau", "cubic-bezier(0.5, 0, 0.9, 0.4)"],
      [IMAGES_EXTINCTION, 0, "--t-halo", "cubic-bezier(0.5, 0, 0.9, 0.4)"],
      [IMAGES_EXTINCTION, 0, "--t-moucheture", "cubic-bezier(0.5, 0, 0.9, 0.4)"],
      [IMAGES_EXTINCTION, 0.0545, "--t-lueur", "cubic-bezier(0.45, 0, 0.7, 0.3)"],
      [IMAGES_EXTINCTION, 0, "--t-page", "steps(1, end)"],
      [IMAGES_EXTINCTION, 0.0727, "--t-brins", "ease-in-out"],
      [IMAGES_EXTINCTION, 0.0818, "--t-filament", "cubic-bezier(0.37, 0, 0.63, 1)"],
      [IMAGES_EXTINCTION, 0.1818, "--t-filament", "cubic-bezier(0.37, 0, 0.63, 1)"],
      [IMAGES_EXTINCTION, 0.3091, "--t-filament", "cubic-bezier(0.37, 0, 0.63, 1)"],
      [IMAGES_EXTINCTION, 0.5091, "--t-filament", "cubic-bezier(0.4, 0, 0.85, 1)"],
    ];
    for (const [jeu, offset, propriete, courbe] of attendus) {
      const image = jeu.find((k) => Number(k.offset) === offset && propriete in k);
      expect(image, `aucune entree pour ${propriete} a l offset ${offset}`).toBeDefined();
      expect(image?.easing).toBe(courbe);
    }
  });

  it("ne pose aucun easing sur les arrets de la rampe chromatique (annexe : aucune courbe specifiee)", () => {
    for (const jeu of [IMAGES_ALLUMAGE, IMAGES_EXTINCTION]) {
      const entreesCouleur = jeu.filter((k) => "--filament-couleur" in k);
      for (const image of entreesCouleur) {
        expect(image.easing).toBeUndefined();
      }
    }
  });
});

describe("rampes chromatiques a six arrets (ronde de correction 2, test 2)", () => {
  it("l allumage passe par les six couleurs de l annexe, dans l ordre, aux bons offsets (entrees supplementaires : arret initial a 0 et plateau final a 1)", () => {
    const attendu: Array<[number, string]> = [
      [0, "#3A3128"], // arret initial, ajoute en ronde 3 (evite l interpolation depuis la valeur sous-jacente)
      [0.0444, "#3A3128"],
      [0.1444, "#A8431A"],
      [0.2222, "#E07A28"],
      [0.3333, "#FFC169"],
      [0.4667, "#FFF3D6"],
      [0.5778, "#FFFDF6"],
      [1, "#FFFDF6"],
    ];
    const trouves = IMAGES_ALLUMAGE.filter((k) => "--filament-couleur" in k).map(
      (k) => [Number(k.offset), k["--filament-couleur"]] as [number, string],
    );
    expect(trouves).toEqual(attendu);
    // Six COULEURS distinctes (la septieme entree n est qu un plateau qui
    // repete la sixieme) : c'est ce que compte l'annexe.
    expect(new Set(trouves.map(([, c]) => c)).size).toBe(6);
  });

  it("l extinction passe par les six couleurs de refroidissement de l annexe, dans l ordre, aux bons offsets", () => {
    const attendu: Array<[number, string]> = [
      [0, "#FFFDF6"],
      [0.0818, "#FFE3A8"],
      [0.1818, "#FFB768"],
      [0.3091, "#E0631E"],
      [0.5091, "#7A2408"],
      [1, "#3A3128"],
    ];
    const trouves = IMAGES_EXTINCTION.filter((k) => "--filament-couleur" in k).map(
      (k) => [Number(k.offset), k["--filament-couleur"]] as [number, string],
    );
    expect(trouves).toEqual(attendu);
  });
});

describe("--t-brins, huitieme variable (ronde de correction 2, test 3)", () => {
  it("existe dans les deux jeux", () => {
    for (const jeu of [IMAGES_ALLUMAGE, IMAGES_EXTINCTION]) {
      expect(jeu.some((k) => "--t-brins" in k)).toBe(true);
    }
  });

  it("a sa propre fenetre a l allumage (180 -> 620 ms), distincte de celle du filament (40 -> 520 ms)", () => {
    const brins = IMAGES_ALLUMAGE.filter((k) => "--t-brins" in k).map((k) => Number(k.offset));
    expect(brins).toEqual([0, 0.2, 0.6889, 1]);
    const filament = IMAGES_ALLUMAGE.filter((k) => "--t-filament" in k).map((k) => Number(k.offset));
    expect(brins).not.toEqual(filament);
  });

  it("a sa propre fenetre a l extinction (80 -> 480 ms), distincte de celle du filament", () => {
    const brins = IMAGES_EXTINCTION.filter((k) => "--t-brins" in k).map((k) => Number(k.offset));
    expect(brins).toEqual([0, 0.0727, 0.4364, 1]);
    const filament = IMAGES_EXTINCTION.filter((k) => "--t-filament" in k).map((k) => Number(k.offset));
    expect(brins).not.toEqual(filament);
  });
});

describe("pic de depassement du filament (ronde de correction 2, test 4)", () => {
  it("vaut exactement 1.08 a l offset 0.5 du jeu d allumage", () => {
    const image = IMAGES_ALLUMAGE.find((k) => Number(k.offset) === 0.5);
    expect(image?.["--t-filament"]).toBe(1.08);
  });

  it("n apparait nulle part dans le jeu d extinction", () => {
    const valeurs = IMAGES_EXTINCTION.filter((k) => "--t-filament" in k).map((k) => k["--t-filament"]);
    expect(valeurs).not.toContain(1.08);
    expect(Math.max(...(valeurs as number[]))).toBeLessThanOrEqual(1);
  });
});

describe("basculerAnimation, reentrance", () => {
  it("cinq bascules alternees, currentTime avancant entre chaque clic comme le ferait l Animation reelle, restent toujours coherentes", () => {
    // On ne peut pas piloter un vrai navigateur ici : `basculerAnimation`
    // est une fonction pure d'un objet `Animation`, c'est precisement
    // pour cela qu'elle est testable ainsi.
    const anim = animationFactice(0, 1, DUREE_ALLUMAGE);

    // 1) au repos, eteinte -> allumage : bascule vers IMAGES_ALLUMAGE/900,
    //    joue depuis 0.
    basculerAnimation(anim, true);
    expect(anim.playbackRate).toBe(1);
    expect(anim.effect.getTiming().duration).toBe(DUREE_ALLUMAGE);

    // 2) en plein allumage (position interieure a 900) -> extinction
    //    demandee : pas de bascule de jeu, cadence inversee.
    anim.currentTime = 300;
    basculerAnimation(anim, false);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
    expect(anim.effect.getTiming().duration).toBe(DUREE_ALLUMAGE); // jeu inchange

    // 3) toujours en pleine transition (jeu d'allumage, cadence negative)
    //    -> re-demande d'allumage : cadence repositive, jeu toujours
    //    inchange.
    anim.currentTime = 150;
    basculerAnimation(anim, true);
    expect(anim.playbackRate).toBe(1);
    expect(anim.effect.getTiming().duration).toBe(DUREE_ALLUMAGE);

    // 4) l'allumage se termine au repos (position = 900) -> extinction :
    //    bascule vers IMAGES_EXTINCTION/1100, joue depuis 0.
    anim.currentTime = DUREE_ALLUMAGE;
    basculerAnimation(anim, false);
    expect(anim.effect.getTiming().duration).toBe(DUREE_EXTINCTION);
    expect(anim.currentTime).toBe(0);

    // 5) en pleine extinction (jeu d'extinction, avancer mene a l'eteint)
    //    -> re-demande d'extinction : la cadence reste 1.
    anim.currentTime = 400;
    basculerAnimation(anim, false);
    expect(anim.playbackRate).toBe(1);

    expect(anim.play).toHaveBeenCalledTimes(5);
  });

  it("un double clic sur le meme etat, a la meme position limite, ne joue qu une seule fois", () => {
    // Jeu d'extinction charge, position en fin de course (1100) : etat de
    // repos "eteinte" (borne opposee au debut du jeu d'extinction, qui
    // represente "allumee" — voir etatDeRepos dans animation.ts). Deux
    // demandes d'extinction identiques de suite ne doivent produire aucun
    // appel a play(), ni au premier ni au second essai.
    const anim = animationFactice(DUREE_EXTINCTION, 1, DUREE_EXTINCTION);
    basculerAnimation(anim, false);
    basculerAnimation(anim, false);
    expect(anim.play).not.toHaveBeenCalled();
    expect(anim.effect.setKeyframes).not.toHaveBeenCalled();
  });
});

describe("mouvementReduit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("vaut false hors navigateur (pas de window/document)", () => {
    expect(mouvementReduit()).toBe(false);
  });

  it("vaut true quand la preference systeme est active sans data-mouvement force", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
    expect(mouvementReduit()).toBe(true);
  });

  it("vaut false quand la preference systeme est active mais que le backoffice force le mouvement", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: { mouvement: "force" } } });
    expect(mouvementReduit()).toBe(false);
  });

  it("vaut false quand la preference systeme n est pas active, meme sans force", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
    expect(mouvementReduit()).toBe(false);
  });
});

describe("basculerAnimation, sous mouvement reduit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pose l etat final sans jouer, vers l allumage, jeu et duree corrects", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
    const anim = animationFactice(300, -1, DUREE_EXTINCTION);
    basculerAnimation(anim, true);
    expect(anim.pause).toHaveBeenCalledTimes(1);
    expect(anim.effect.setKeyframes).toHaveBeenCalledExactlyOnceWith(IMAGES_ALLUMAGE);
    expect(anim.effect.updateTiming).toHaveBeenCalledExactlyOnceWith({ duration: DUREE_ALLUMAGE });
    expect(anim.currentTime).toBe(DUREE_ALLUMAGE);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("pose l etat final sans jouer, vers l extinction, jeu et duree corrects", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
    const anim = animationFactice(300, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, false);
    expect(anim.pause).toHaveBeenCalledTimes(1);
    expect(anim.effect.setKeyframes).toHaveBeenCalledExactlyOnceWith(IMAGES_EXTINCTION);
    expect(anim.effect.updateTiming).toHaveBeenCalledExactlyOnceWith({ duration: DUREE_EXTINCTION });
    expect(anim.currentTime).toBe(0);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("rejoue normalement quand data-mouvement force le mouvement, meme preference active", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: { mouvement: "force" } } });
    const anim = animationFactice(450, 1, DUREE_ALLUMAGE);
    basculerAnimation(anim, false);
    expect(anim.pause).not.toHaveBeenCalled();
    expect(anim.play).toHaveBeenCalledTimes(1);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
  });
});

describe("creerAnimation", () => {
  it("anime le jeu d allumage sur sa duree, en pause a la creation", () => {
    const animeRendu = { pause: vi.fn() };
    const cible = {
      animate: vi.fn(() => animeRendu),
    } as unknown as HTMLElement;

    const resultat = creerAnimation(cible);

    expect(cible.animate).toHaveBeenCalledTimes(1);
    const [images, options] = (cible.animate as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(images).toBe(IMAGES_ALLUMAGE);
    expect(options).toMatchObject({ duration: DUREE_ALLUMAGE, fill: "both" });
    expect(animeRendu.pause).toHaveBeenCalledTimes(1);
    expect(resultat).toBe(animeRendu);
  });
});
