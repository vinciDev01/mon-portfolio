import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { PersonalInfoDto, SiteSettingsDto } from "@portfolio/shared-types";
import { I18nProvider } from "../i18n/i18n-context";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { bloc, cssNu } from "./feuille-test";

/* Au sommet de la colonne, une boussole remplace les initiales : le site est
   un parcours, la boussole l'oriente. Un logo charge au backoffice garde la
   priorite. */

const REGLAGES = {
  showProjects: true,
  showCvDownload: false,
  logoPath: null,
  availabilityStatus: "available",
  availabilityLabel: null,
} as unknown as SiteSettingsDto;
const INFOS = { name: "Bertrand", surname: "Fanuel", avatarPath: null } as unknown as PersonalInfoDto;

const rendre = (reglages: SiteSettingsDto) =>
  renderToStaticMarkup(
    createElement(
      I18nProvider as ComponentType<{ defaultLocale: string }>,
      { defaultLocale: "fr" },
      createElement(ColonnePassage, { reglages, infos: INFOS }),
    ),
  );

/** Le lien d'identite, du sommet de la colonne. */
const identite = (html: string) => /<a[^>]*class="identite-mat"[\s\S]*?<\/a>/.exec(html)?.[0] ?? "";

describe("la boussole au sommet de la colonne", () => {
  it("remplace les initiales, decorative, le lien gardant le nom complet", () => {
    const lien = identite(rendre(REGLAGES));
    expect(lien).toMatch(/aria-label="Bertrand Fanuel"/);
    expect(lien).toMatch(/<svg class="identite-boussole"[^>]*aria-hidden="true"/);
    expect(lien).not.toContain("identite-initiales");
    expect(lien).not.toMatch(/>BF</);
  });

  it("porte une rose a quatre points cardinaux et une aiguille en deux moities", () => {
    const lien = identite(rendre(REGLAGES));
    expect(lien.match(/class="boussole-repere"/g)).toHaveLength(4);
    expect(lien).toContain('class="boussole-nord"');
    expect(lien).toContain('class="boussole-sud"');
  });

  it("un logo charge garde la priorite sur la boussole", () => {
    const lien = identite(rendre({ ...REGLAGES, logoPath: "logos/l.webp" } as SiteSettingsDto));
    expect(lien).toContain("identite-logo");
    expect(lien).not.toContain("identite-boussole");
  });

  it("le nord porte l accent, seule couleur du site ; aucune animation", () => {
    expect(bloc(/\.boussole-nord\s*\{/)).toMatch(/fill:\s*var\(--accent\)/);
    expect(cssNu).not.toMatch(/\.(?:identite-boussole|boussole-[a-z]+)[^{]*\{[^}]*animation/);
  });
});
