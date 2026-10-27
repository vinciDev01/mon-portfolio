// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import { I18nProvider } from "../i18n/i18n-context";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { empreinteDuClic, tracerEmpreinte } from "@/components/parcours/empreinte";
import type { PersonalInfoDto, SiteSettingsDto } from "@portfolio/shared-types";
import { bloc } from "./feuille-test";

/* L'empreinte : un clic de pointeur sur une entree de la colonne laisse la
   trace d'un doigt au point clique, jusqu'au clic suivant. */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const Fournisseur = I18nProvider as ComponentType<{ defaultLocale: string }>;
const REGLAGES = {
  showProjects: true,
  showContact: true,
  showCvDownload: false,
  logoPath: null,
  availabilityStatus: "available",
  availabilityLabel: null,
} as unknown as SiteSettingsDto;
const INFOS = { name: "Bertrand", surname: "Fanuel", avatarPath: null } as unknown as PersonalInfoDto;

let racine: Root;
let hote: HTMLElement;

beforeEach(() => {
  hote = document.createElement("div");
  document.body.appendChild(hote);
  racine = createRoot(hote);
  act(() => {
    racine.render(
      createElement(Fournisseur, { defaultLocale: "fr" }, createElement(ColonnePassage, { reglages: REGLAGES, infos: INFOS })),
    );
  });
});

afterEach(() => {
  act(() => racine.unmount());
  hote.remove();
});

const colonne = () => hote.querySelector<HTMLElement>(".colonne-passage")!;
const taches = () => [...hote.querySelectorAll<SVGElement>(".empreinte")];
const cliquer = (cible: Element, x: number, y: number, detail = 1) =>
  act(() => {
    cible.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: x, clientY: y, detail }));
  });
const entree = (href: string) => hote.querySelector(`a.entree-parcours[href="${href}"]`)!;

describe("empreinte de la colonne", () => {
  it("aucune tache avant le premier clic", () => {
    expect(taches()).toHaveLength(0);
  });

  it("un clic sur une entree pose une tache au point clique", () => {
    cliquer(entree("#projets"), 42, 117);
    expect(taches()).toHaveLength(1);
    expect(taches()[0]!.style.left).toBe("42px");
    expect(taches()[0]!.style.top).toBe("117px");
    expect(taches()[0]!.getAttribute("aria-hidden")).toBe("true");
  });

  it("le clic suivant la deplace : une seule tache a la fois", () => {
    cliquer(entree("#projets"), 42, 117);
    cliquer(entree("#contact"), 30, 160);
    expect(taches()).toHaveLength(1);
    expect(taches()[0]!.style.top).toBe("160px");
  });

  it("une activation au clavier n en pose pas", () => {
    cliquer(entree("#projets"), 0, 0, 0);
    expect(taches()).toHaveLength(0);
  });

  it("un clic hors des entrees n en pose pas", () => {
    cliquer(colonne(), 50, 500);
    expect(taches()).toHaveLength(0);
  });

  it("tient compte du defilement de la colonne", () => {
    const c = document.createElement("nav");
    const a = document.createElement("a");
    a.className = "entree-parcours";
    c.appendChild(a);
    Object.defineProperty(c, "scrollTop", { value: 80 });
    c.getBoundingClientRect = () => ({ left: 10, top: 20 }) as DOMRect;
    const t = empreinteDuClic({ clientX: 50, clientY: 60, detail: 1, target: a }, c, () => 0.5);
    expect(t).toMatchObject({ x: 40, y: 120, graine: 500000, angle: 0 });
  });

  it("disparait au changement de taille de la fenetre", () => {
    cliquer(entree("#projets"), 42, 117);
    act(() => void window.dispatchEvent(new Event("resize")));
    expect(taches()).toHaveLength(0);
  });

  it("est statique, transparente aux clics et centree sur le point", () => {
    const css = readFileSync(path.resolve(import.meta.dirname, "../../app/globals.css"), "utf8");
    const b = bloc(/\.empreinte\s*\{/, css);
    expect(b).toMatch(/position:\s*absolute/);
    expect(b).toMatch(/pointer-events:\s*none/);
    expect(b).toMatch(/margin:\s*-10px 0 0 -8px/);
    expect(b).not.toMatch(/transition|animation/);
    const src = readFileSync(path.resolve(import.meta.dirname, "../../components/parcours/empreinte.tsx"), "utf8");
    expect(src).not.toMatch(/transition|animation|@keyframes/);
  });

  it("une empreinte : six sillons ouverts, dans sa boite, jamais deux pareilles", () => {
    const d = tracerEmpreinte(42);
    expect(d.match(/M /g)).toHaveLength(6);
    for (const m of d.matchAll(/(-?[\d.]+) (-?[\d.]+)(?= |$)/g)) {
      const [x, y] = [Number(m[1]), Number(m[2])];
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(20);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(24);
    }
    expect(tracerEmpreinte(42)).toBe(d);
    expect(tracerEmpreinte(43)).not.toBe(d);
  });

  it("un doigt pose de biais, jamais a l envers", () => {
    const c = document.createElement("nav");
    const a = document.createElement("a");
    a.className = "entree-parcours";
    c.appendChild(a);
    c.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect;
    for (const h of [0, 0.999]) {
      const t = empreinteDuClic({ clientX: 1, clientY: 1, detail: 1, target: a }, c, () => h)!;
      expect(Math.abs(t.angle)).toBeLessThanOrEqual(35);
    }
  });
});
