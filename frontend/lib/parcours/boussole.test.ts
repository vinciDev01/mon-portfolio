import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PersonalInfoDto, SiteSettingsDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { FournisseurSectionActive } from "@/components/parcours/parcours-pagine";
import { bloc, cssNu } from "./feuille-test";

/* Au sommet de la colonne, une boussole a clapet remplace les initiales : le
   site est un parcours, elle l'oriente. Son aiguille prend un cap par
   section ; le clapet, ouvert au repos, se referme au survol. Un logo charge
   au backoffice garde la priorite. */

const REGLAGES = {
  showProjects: true,
  showContact: true,
  showCvDownload: false,
  logoPath: null,
  availabilityStatus: "available",
  availabilityLabel: null,
} as unknown as SiteSettingsDto;
const INFOS = { name: "Bertrand", surname: "Fanuel", avatarPath: null } as unknown as PersonalInfoDto;

const rendre = (reglages: SiteSettingsDto, active = "ouverture") =>
  renderToStaticMarkup(
    createElement(
      I18nProvider as ComponentType<{ defaultLocale: string }>,
      { defaultLocale: "fr" },
      createElement(
        FournisseurSectionActive as ComponentType<{ initial: string | null }>,
        { initial: active },
        createElement(ColonnePassage, { reglages, infos: INFOS }),
      ),
    ),
  );

/** Le lien d'identite, du sommet de la colonne. */
const identite = (html: string) => /<a[^>]*class="identite-mat"[\s\S]*?<\/a>/.exec(html)?.[0] ?? "";
/** La rotation de l'aiguille, en degres. */
const cap = (html: string) => Number(/class="boussole-aiguille"[^>]*style="transform:rotate\((-?[\d.]+)deg\)/.exec(html)?.[1]);

describe("la boussole a clapet au sommet de la colonne", () => {
  it("remplace les initiales, decorative, le lien gardant le nom complet", () => {
    const lien = identite(rendre(REGLAGES));
    expect(lien).toMatch(/aria-label="Bertrand Fanuel"/);
    expect(lien).toMatch(/<span class="identite-boussole" aria-hidden="true">/);
    expect(lien).not.toContain("identite-initiales");
    expect(lien).not.toMatch(/>BF</);
  });

  it("un boitier a quatre reperes, une aiguille en deux moities, et un clapet", () => {
    const lien = identite(rendre(REGLAGES));
    expect(lien.match(/class="boussole-repere"/g)).toHaveLength(4);
    expect(lien).toContain('class="boussole-nord"');
    expect(lien).toContain('class="boussole-sud"');
    expect(lien).toMatch(/<svg class="boussole-clapet"/);
  });

  it("l aiguille prend le cap de la section active : un tour reparti sur les sections", () => {
    // Trois sections : ouverture, projets, contact.
    expect(cap(rendre(REGLAGES, "ouverture"))).toBe(0);
    expect(cap(rendre(REGLAGES, "projets"))).toBe(120);
    expect(cap(rendre(REGLAGES, "contact"))).toBe(-120);
  });

  it("un logo charge garde la priorite sur la boussole", () => {
    const lien = identite(rendre({ ...REGLAGES, logoPath: "logos/l.webp" } as SiteSettingsDto));
    expect(lien).toContain("identite-logo");
    expect(lien).not.toContain("identite-boussole");
  });
});

describe("le clapet couleur cafe", () => {
  it("le couvercle et la charniere prennent le cafe, declare sur la boussole", () => {
    const cafe = /--cafe:\s*(#[0-9a-f]{6})/i.exec(bloc(/\.identite-boussole\s*\{/))?.[1];
    expect(cafe, "--cafe introuvable sur .identite-boussole").toBeDefined();
    // Un brun : le rouge domine le vert, qui domine le bleu.
    const [r, v, b] = [1, 3, 5].map((i) => parseInt(cafe!.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(v);
    expect(v).toBeGreaterThan(b);
    expect(bloc(/\.boussole-couvercle\s*\{/)).toMatch(/fill:\s*var\(--cafe\)/);
    expect(bloc(/\.boussole-charniere\s*\{/)).toMatch(/fill:\s*var\(--cafe/);
  });
});

describe("la devise gravee sur le pourtour du clapet", () => {
  it("suit le cercle du bord, entre la gravure et l arete", () => {
    const lien = identite(rendre(REGLAGES));
    const clapet = /<svg class="boussole-clapet"[\s\S]*?<\/svg>/.exec(lien)?.[0] ?? "";
    const chemin = /<path id="([^"]+)" class="boussole-pourtour" d="M 18 ([\d.]+) A ([\d.]+) /.exec(clapet);
    expect(chemin, "chemin du pourtour introuvable").not.toBeNull();
    const rayon = Number(chemin![3]);
    expect(rayon).toBeGreaterThan(12);
    expect(rayon).toBeLessThan(16.5);
    expect(clapet).toMatch(
      new RegExp(`<text class="boussole-devise"[^>]*><textPath href="#${chemin![1]}"[^>]*>God is good all the time</textPath>`),
    );
  });

  it("en petit, dans la teinte de la gravure", () => {
    const devise = bloc(/\.boussole-devise\s*\{/);
    expect(devise).toMatch(/fill:\s*var\(--cafe-gravure\)/);
    expect(Number(/font-size:\s*([\d.]+)px/.exec(devise)?.[1])).toBeLessThanOrEqual(3.5);
  });
});

describe("l affolement au chargement", () => {
  it("un groupe interieur a l aiguille porte l affolement, le cap reste dehors", () => {
    const lien = identite(rendre(REGLAGES));
    expect(lien).toMatch(/class="boussole-aiguille"[^>]*><g class="boussole-affolement">/);
  });

  it("l aiguille s affole puis revient a zero, donc sur le cap de la section", () => {
    const anim = bloc(/\.boussole-affolement\s*\{/);
    const nom = /animation:\s*([a-z-]+)\s/.exec(anim)?.[1];
    expect(nom).toBeDefined();
    const images = bloc(new RegExp(`@keyframes ${nom}\\s*\\{`));
    expect(images).toMatch(/to\s*\{\s*transform:\s*rotate\(0(deg)?\)/);
    // Au moins trois changements de sens : elle cherche, elle ne tourne pas.
    const angles = [...images.matchAll(/rotate\((-?\d+)deg\)/g)].map((m) => Number(m[1]));
    const sens = angles.slice(1).map((a, i) => Math.sign(a - angles[i]!)).filter(Boolean);
    expect(sens.slice(1).filter((x, i) => x !== sens[i]).length).toBeGreaterThanOrEqual(3);
  });
});

describe("la feuille de la boussole", () => {
  it("le nord porte l accent, seule couleur du site", () => {
    expect(bloc(/\.boussole-nord\s*\{/)).toMatch(/fill:\s*var\(--accent\)/);
  });

  it("l aiguille tourne avec un leger depassement, autour du centre du cadran", () => {
    const aiguille = bloc(/\.boussole-aiguille\s*\{/);
    expect(aiguille).toMatch(/transform-origin:\s*18px 18px/);
    expect(aiguille).toMatch(/transition:\s*transform[^;]*cubic-bezier\([^)]*1\.\d+/);
  });

  it("le clapet, ouvert au repos, se referme au survol et au focus clavier", () => {
    expect(bloc(/\}\s*\.boussole-clapet\s*\{/)).toMatch(/transform:\s*rotateX\(-\d+deg\)/);
    expect(cssNu).toMatch(
      /\.identite-mat:hover \.boussole-clapet,\s*\.identite-mat:focus-visible \.boussole-clapet\s*\{\s*transform:\s*rotateX\(0(deg)?\)/,
    );
  });

  it("sans mouvement demande, aiguille et clapet changent sans transition", () => {
    expect(cssNu).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root:not\(\[data-mouvement="force"\]\) \.boussole-aiguille,\s*:root:not\(\[data-mouvement="force"\]\) \.boussole-clapet\s*\{\s*transition:\s*none/,
    );
    expect(cssNu).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^@]*:root:not\(\[data-mouvement="force"\]\) \.boussole-affolement\s*\{\s*animation:\s*none/,
    );
  });
});
