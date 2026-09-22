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

  it("garde la cadence 1 quand l allumage est declenche a mi-extinction", () => {
    const anim = animationFactice(450, -DUREE_ALLUMAGE / DUREE_EXTINCTION, DUREE_EXTINCTION);
    basculerAnimation(anim, true);
    expect(anim.playbackRate).toBe(1);
    expect(anim.play).toHaveBeenCalledTimes(1);
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

describe("IMAGES_ALLUMAGE / IMAGES_EXTINCTION, offsets (ronde de correction 1, test 3)", () => {
  it("sont strictement croissants sur l ensemble du tableau (exigence de la WAAPI)", () => {
    for (const jeu of [IMAGES_ALLUMAGE, IMAGES_EXTINCTION]) {
      for (let i = 1; i < jeu.length; i++) {
        expect(Number(jeu[i].offset)).toBeGreaterThan(Number(jeu[i - 1].offset));
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

  it("definissent les sept variables des le premier et le dernier offset", () => {
    const variables = [
      "--t-filament",
      "--t-lueur",
      "--t-faisceau",
      "--t-halo",
      "--t-moucheture",
      "--t-page",
      "--filament-couleur",
    ];
    for (const jeu of [IMAGES_ALLUMAGE, IMAGES_EXTINCTION]) {
      for (const v of variables) {
        expect(jeu[0]).toHaveProperty(v);
        expect(jeu[jeu.length - 1]).toHaveProperty(v);
      }
    }
  });

  it("se rejoignent aux deux bornes : fin de l un = debut de l autre", () => {
    const fin = IMAGES_ALLUMAGE[IMAGES_ALLUMAGE.length - 1];
    const debutExtinction = IMAGES_EXTINCTION[0];
    const finExtinction = IMAGES_EXTINCTION[IMAGES_EXTINCTION.length - 1];
    const debutAllumage = IMAGES_ALLUMAGE[0];
    for (const v of ["--t-filament", "--t-lueur", "--t-faisceau", "--t-halo", "--t-moucheture", "--filament-couleur"]) {
      expect(fin[v]).toBe(debutExtinction[v]);
      expect(finExtinction[v]).toBe(debutAllumage[v]);
    }
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

    // 5) en pleine extinction -> re-demande d'extinction (deja en cours
    //    dans le meme sens) : aucun changement de cadence necessaire au
    //    sens strict, mais l'appel reste sans danger.
    anim.currentTime = 400;
    basculerAnimation(anim, false);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);

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
