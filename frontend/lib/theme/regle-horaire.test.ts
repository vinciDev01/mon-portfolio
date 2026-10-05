import { describe, it, expect } from "vitest";
import { CLE_STOCKAGE, themeSelonHeure, type Strategie } from "./regle-horaire";
import { scriptInitial } from "./script-initial";

describe("themeSelonHeure, strategie auto", () => {
  it("rend le theme sombre en pleine journee", () => {
    expect(themeSelonHeure(12, "auto")).toBe("sombre");
  });

  it("rend le theme clair en pleine nuit", () => {
    expect(themeSelonHeure(2, "auto")).toBe("clair");
  });

  it("bascule au sombre a 7h00 pile", () => {
    expect(themeSelonHeure(6, "auto")).toBe("clair");
    expect(themeSelonHeure(7, "auto")).toBe("sombre");
  });

  it("bascule au clair a 19h00 pile", () => {
    expect(themeSelonHeure(18, "auto")).toBe("sombre");
    expect(themeSelonHeure(19, "auto")).toBe("clair");
  });

  it("couvre les vingt-quatre heures sans trou", () => {
    for (let h = 0; h < 24; h++) {
      expect(["clair", "sombre"]).toContain(themeSelonHeure(h, "auto"));
    }
  });

  it("donne exactement douze heures de chaque theme", () => {
    const heures = Array.from({ length: 24 }, (_, h) => themeSelonHeure(h, "auto"));
    expect(heures.filter((t) => t === "sombre")).toHaveLength(12);
    expect(heures.filter((t) => t === "clair")).toHaveLength(12);
  });
});

describe("themeSelonHeure, strategies explicites", () => {
  it("ignore l heure quand la strategie impose le clair", () => {
    for (const h of [0, 7, 12, 19, 23]) {
      expect(themeSelonHeure(h, "clair")).toBe("clair");
    }
  });

  it("ignore l heure quand la strategie impose le sombre", () => {
    for (const h of [0, 7, 12, 19, 23]) {
      expect(themeSelonHeure(h, "sombre")).toBe("sombre");
    }
  });
});

describe("themeSelonHeure, entrees aberrantes", () => {
  it("retombe sur le sombre pour une heure hors plage", () => {
    expect(themeSelonHeure(-1, "auto")).toBe("sombre");
    expect(themeSelonHeure(24, "auto")).toBe("sombre");
    expect(themeSelonHeure(Number.NaN, "auto")).toBe("sombre");
  });

  it("retombe sur le sombre pour une strategie inconnue", () => {
    expect(themeSelonHeure(2, "crepuscule" as never)).toBe("sombre");
  });
});

describe("scriptInitial", () => {
  /**
   * Execute le script REELLEMENT emis dans un faux `document` /
   * `localStorage` / `Date`, et rend la classe qu'il a posee sur <html>.
   */
  function classePosee(strategie: Strategie, heure: number, stocke: string | null): string[] {
    const classes: string[] = [];
    const faux = {
      documentElement: {
        classList: {
          remove: (...n: string[]) => {
            for (const x of n) {
              const i = classes.indexOf(x);
              if (i >= 0) classes.splice(i, 1);
            }
          },
          add: (n: string) => classes.push(n),
        },
        style: {} as Record<string, string>,
      },
    };
    const stockage = { getItem: (k: string) => (k === CLE_STOCKAGE ? stocke : null) };
    class FausseDate {
      getHours() {
        return heure;
      }
    }
    new Function("document", "localStorage", "Date", scriptInitial(strategie))(
      faux,
      stockage,
      FausseDate,
    );
    return classes;
  }

  it("applique la meme regle horaire que la fonction, heure par heure", () => {
    // Le script ne peut pas importer de module : il duplique la regle. On
    // l'EVALUE (sans rien recoder du sens) et on compare la classe posee.
    for (let h = 0; h < 24; h++) {
      expect(classePosee("auto", h, null)).toEqual([themeSelonHeure(h, "auto")]);
    }
  });

  it("applique les strategies explicites, a toute heure", () => {
    for (const h of [0, 7, 12, 19, 23]) {
      expect(classePosee("clair", h, null)).toEqual(["clair"]);
      expect(classePosee("sombre", h, null)).toEqual(["sombre"]);
    }
  });

  it("precedence : localStorage > strategie > horaire", () => {
    // localStorage l'emporte sur la strategie et sur l'heure.
    expect(classePosee("sombre", 2, "clair")).toEqual(["clair"]);
    expect(classePosee("clair", 12, "sombre")).toEqual(["sombre"]);
    expect(classePosee("auto", 12, "clair")).toEqual(["clair"]);
    // Valeur stockee aberrante : ignoree, la strategie reprend la main.
    expect(classePosee("clair", 12, "n'importe quoi")).toEqual(["clair"]);
    // La strategie explicite l'emporte sur l'heure.
    expect(classePosee("sombre", 2, null)).toEqual(["sombre"]);
  });

  it("inscrit la strategie explicite telle quelle", () => {
    expect(scriptInitial("clair")).toContain('"clair"');
  });

  it("retombe sur le sombre si quoi que ce soit echoue", () => {
    expect(scriptInitial("auto")).toContain('classList.add("sombre")');
  });

  it("n emet jamais </script quelle que soit l entree, y compris malveillante", () => {
    const entrees: string[] = [
      "auto",
      "clair",
      "sombre",
      // Entrees volontairement malveillantes : le type Strategie ne les
      // autorise pas, mais rien en base ne les empeche d'y arriver malgre
      // tout (colonne Prisma en String libre). scriptInitial doit rester
      // sure meme forcee avec ces valeurs.
      "</script><script>alert(1)</script>",
      "</SCRIPT><img src=x onerror=alert(1)>",
      "<//script>",
    ];
    for (const entree of entrees) {
      const src = scriptInitial(entree as never);
      expect(src.toLowerCase()).not.toContain("</script");
    }
  });
});
