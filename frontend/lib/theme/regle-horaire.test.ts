import { describe, it, expect } from "vitest";
import { themeSelonHeure } from "./regle-horaire";
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
  it("applique la meme regle horaire que la fonction, heure par heure", () => {
    // Le script ne peut pas importer de module : il duplique la regle.
    // Ce test verifie que les deux ne divergeront pas en silence.
    const src = scriptInitial("auto");
    const seuils = src.match(/h>=(\d+)&&h<(\d+)/);
    expect(seuils).not.toBeNull();
    const [, debut, fin] = seuils!;
    for (let h = 0; h < 24; h++) {
      const duScript = h >= Number(debut) && h < Number(fin) ? "sombre" : "clair";
      expect(duScript).toBe(themeSelonHeure(h, "auto"));
    }
  });

  it("inscrit la strategie explicite telle quelle", () => {
    expect(scriptInitial("clair")).toContain('"clair"');
  });

  it("retombe sur le sombre si quoi que ce soit echoue", () => {
    expect(scriptInitial("auto")).toContain('classList.add("sombre")');
  });
});
