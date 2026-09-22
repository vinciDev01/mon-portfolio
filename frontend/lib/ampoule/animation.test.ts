import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DUREE_ALLUMAGE,
  DUREE_EXTINCTION,
  basculerAnimation,
  creerAnimation,
  mouvementReduit,
} from "./animation";

/**
 * Double factice d'un `Animation` de la Web Animations API : seuls
 * `currentTime`, `playbackRate`, `play`, `pause` sont necessaires a
 * `basculerAnimation`. L'environnement de test est "node" (vitest.config.ts,
 * modules purs sans DOM) : `Animation` n'existe pas reellement, d'ou le
 * `as unknown as Animation`.
 */
function animationFactice(currentTime: number, playbackRate = 1) {
  const anim = {
    currentTime,
    playbackRate,
    play: vi.fn(),
    pause: vi.fn(),
  };
  return anim as unknown as Animation & { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> };
}

describe("basculerAnimation, bug 1 de l addendum (cadence perdue par reverse)", () => {
  it("garde la cadence -900/1100 quand l extinction est declenchee a mi-allumage", () => {
    const anim = animationFactice(450, 1);
    basculerAnimation(anim, false);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
    expect(anim.playbackRate).not.toBe(-1);
    expect(anim.play).toHaveBeenCalledTimes(1);
  });

  it("garde la cadence 1 quand l allumage est declenche a mi-extinction", () => {
    // Position courante quelconque entre les deux bornes : ici a mi-chemin
    // d'une extinction (cadence negative), on redemande l allumage.
    const anim = animationFactice(450, -DUREE_ALLUMAGE / DUREE_EXTINCTION);
    basculerAnimation(anim, true);
    expect(anim.playbackRate).toBe(1);
    expect(anim.play).toHaveBeenCalledTimes(1);
  });
});

describe("basculerAnimation, bug 2 de l addendum (play() se rembobine tout seul)", () => {
  it("ne declenche aucun play() si l extinction est demandee alors que la lampe est deja eteinte", () => {
    const anim = animationFactice(0, -DUREE_ALLUMAGE / DUREE_EXTINCTION);
    basculerAnimation(anim, false);
    expect(anim.play).not.toHaveBeenCalled();
    // Le garde-fou coupe avant meme d ecrire playbackRate : la valeur en
    // place, quelle qu elle soit, n est pas touchee.
    expect(anim.playbackRate).toBe(-DUREE_ALLUMAGE / DUREE_EXTINCTION);
  });

  it("ne declenche aucun play() si l allumage est demande alors que la lampe est deja allumee", () => {
    const anim = animationFactice(DUREE_ALLUMAGE, 1);
    basculerAnimation(anim, true);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("tolere un currentTime au-dela de la duree (arrondi flottant) sans jamais jouer au-dela", () => {
    const anim = animationFactice(DUREE_ALLUMAGE + 0.5, 1);
    basculerAnimation(anim, true);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("joue normalement quand la position est strictement a l interieur des bornes", () => {
    const anim = animationFactice(1, 1);
    basculerAnimation(anim, false);
    expect(anim.play).toHaveBeenCalledTimes(1);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
  });
});

describe("basculerAnimation, reentrance (etape 4 / addendum point D)", () => {
  it("cinq bascules alternees, currentTime avancant entre chaque clic comme le ferait l Animation reelle, restent toujours coherentes", () => {
    // On ne peut pas piloter un vrai navigateur ici (addendum, point D) :
    // `basculerAnimation` est une fonction pure d un objet `Animation`,
    // c est precisement pour cela qu elle est testable ainsi. On simule
    // cinq clics rapides en avancant `currentTime` a la main entre deux
    // appels (des positions interieures aux bornes, comme le ferait la
    // WAAPI apres quelques millisecondes de lecture), et on verifie qu
    // aucun appel ne se perd et que la cadence suit toujours la direction
    // demandee.
    const anim = animationFactice(0, 1);
    const positions = [0, 300, 450, 150, 600];
    const demandes = [true, false, true, false, true];

    demandes.forEach((versAllume, i) => {
      anim.currentTime = positions[i];
      basculerAnimation(anim, versAllume);
      if (versAllume) {
        expect(anim.playbackRate).toBeGreaterThan(0);
      } else {
        expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
      }
    });

    expect(anim.play).toHaveBeenCalledTimes(5);
  });

  it("un double clic sur le meme etat, a la meme position limite, ne joue qu une seule fois", () => {
    // Cas degenere : la lampe vient de finir son extinction (currentTime a
    // 0) et on redemande l extinction deux fois de suite sans qu aucun
    // temps ne s ecoule entre les deux — le second clic ne doit produire
    // aucun `play()` supplementaire (bug 2 de l addendum, en situation de
    // double clic reel plutot qu un seul appel isole).
    const anim = animationFactice(0, -DUREE_ALLUMAGE / DUREE_EXTINCTION);
    basculerAnimation(anim, false);
    basculerAnimation(anim, false);
    expect(anim.play).not.toHaveBeenCalled();
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

  it("pose l etat final sans jouer, vers l allumage", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
    const anim = animationFactice(300, -1);
    basculerAnimation(anim, true);
    expect(anim.pause).toHaveBeenCalledTimes(1);
    expect(anim.currentTime).toBe(DUREE_ALLUMAGE);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("pose l etat final sans jouer, vers l extinction", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: {} } });
    const anim = animationFactice(300, 1);
    basculerAnimation(anim, false);
    expect(anim.pause).toHaveBeenCalledTimes(1);
    expect(anim.currentTime).toBe(0);
    expect(anim.play).not.toHaveBeenCalled();
  });

  it("rejoue normalement quand data-mouvement force le mouvement, meme preference active", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("document", { documentElement: { dataset: { mouvement: "force" } } });
    const anim = animationFactice(450, 1);
    basculerAnimation(anim, false);
    expect(anim.pause).not.toHaveBeenCalled();
    expect(anim.play).toHaveBeenCalledTimes(1);
    expect(anim.playbackRate).toBeCloseTo(-DUREE_ALLUMAGE / DUREE_EXTINCTION, 6);
  });
});

describe("creerAnimation", () => {
  it("anime --lampe-t de 0 a 1 sur la duree de l allumage, en pause a la creation", () => {
    const animeRendu = { pause: vi.fn() };
    const cible = {
      animate: vi.fn(() => animeRendu),
    } as unknown as HTMLElement;

    const resultat = creerAnimation(cible);

    expect(cible.animate).toHaveBeenCalledTimes(1);
    const [images, options] = (cible.animate as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(images).toEqual([{ "--lampe-t": 0 }, { "--lampe-t": 1 }]);
    expect(options).toMatchObject({ duration: DUREE_ALLUMAGE, fill: "both" });
    expect(animeRendu.pause).toHaveBeenCalledTimes(1);
    expect(resultat).toBe(animeRendu);
  });
});
