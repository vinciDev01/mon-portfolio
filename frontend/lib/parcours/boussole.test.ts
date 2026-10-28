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
  });
});
