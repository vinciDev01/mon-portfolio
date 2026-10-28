// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { I18nProvider, useTranslation } from "./i18n-context";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Un paragraphe dans la langue courante, et un bouton par langue. */
function Sonde() {
  const { t, locale, setLocale } = useTranslation();
  return createElement(
    "div",
    null,
    createElement("p", { "data-locale": locale }, t("nav.skills")),
    ...(["fr", "en", "de"] as const).map((l) =>
      createElement("button", { key: l, type: "button", "data-langue": l, onClick: () => setLocale(l) }, l),
    ),
  );
}
const changer = (l: string) => hote.querySelector<HTMLButtonElement>(`button[data-langue="${l}"]`)!.click();

let racine: Root;
let hote: HTMLElement;
const monter = () =>
  act(() =>
    racine.render(createElement(I18nProvider as ComponentType<{ defaultLocale: string }>, { defaultLocale: "fr" }, createElement(Sonde))),
  );

beforeEach(() => {
  localStorage.clear();
  hote = document.createElement("div");
  document.body.appendChild(hote);
  racine = createRoot(hote);
});
afterEach(() => {
  act(() => racine.unmount());
  hote.remove();
  vi.restoreAllMocks();
});

describe("la langue du site", () => {
  it("part de la langue par defaut, change, et la retient", () => {
    monter();
    expect(hote.querySelector("p")!.dataset.locale).toBe("fr");
    act(() => changer("en"));
    expect(hote.querySelector("p")!.dataset.locale).toBe("en");
    expect(localStorage.getItem("portfolio-locale")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
  });

  it("reprend la langue retenue au montage", () => {
    localStorage.setItem("portfolio-locale", "de");
    monter();
    expect(hote.querySelector("p")!.dataset.locale).toBe("de");
  });

  it("ignore une valeur retenue invalide", () => {
    localStorage.setItem("portfolio-locale", "xx");
    monter();
    expect(hote.querySelector("p")!.dataset.locale).toBe("fr");
  });

  it("change quand meme si le navigateur refuse le stockage", () => {
    monter();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("refuse");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("refuse");
    });
    act(() => changer("de"));
    expect(hote.querySelector("p")!.dataset.locale).toBe("de");
  });
});
