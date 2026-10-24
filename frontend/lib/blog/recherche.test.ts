// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { BlogCategoryDto, BlogPostDto } from "@portfolio/shared-types";
import { ExplorateurBlog } from "@/components/blog/explorateur-blog";
import { filtrerArticles, grouperParCategorie, normaliser } from "./recherche";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const categorie = (id: string, name: string, sortOrder = 0): BlogCategoryDto => ({ id, name, sortOrder });

function article(id: string, extra: Partial<BlogPostDto> = {}): BlogPostDto {
  return {
    id,
    title: `Titre ${id}`,
    slug: id,
    coverImagePath: null,
    content: "",
    excerpt: null,
    isPublished: true,
    publishedAt: "2026-01-01T00:00:00.000Z",
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    categoryId: null,
    category: null,
    ...extra,
  };
}

describe("normaliser", () => {
  it("ignore la casse et les accents", () => {
    expect(normaliser("Expérience ÉLÈVE")).toBe("experience eleve");
  });
});

describe("filtrerArticles", () => {
  const a = article("a", { title: "Flutter vs React Native", content: "mon retour" });
  const b = article("b", { title: "Spring Boot", excerpt: "Pourquoi le backend Java" });
  const c = article("c", { title: "Notes", content: "Une expérience avec Spring" });

  it("rend tout pour une requete vide ou blanche", () => {
    expect(filtrerArticles([a, b, c], "")).toHaveLength(3);
    expect(filtrerArticles([a, b, c], "   ")).toHaveLength(3);
  });

  it("cherche dans le titre, le resume et le contenu", () => {
    expect(filtrerArticles([a, b, c], "flutter").map((x) => x.id)).toEqual(["a"]);
    expect(filtrerArticles([a, b, c], "java").map((x) => x.id)).toEqual(["b"]);
    expect(filtrerArticles([a, b, c], "retour").map((x) => x.id)).toEqual(["a"]);
  });

  it("sans tenir compte des accents ni de la casse", () => {
    expect(filtrerArticles([a, b, c], "EXPERIENCE").map((x) => x.id)).toEqual(["c"]);
  });

  it("exige chaque mot, ou qu il soit", () => {
    expect(filtrerArticles([a, b, c], "spring experience").map((x) => x.id)).toEqual(["c"]);
    expect(filtrerArticles([a, b, c], "spring").map((x) => x.id)).toEqual(["b", "c"]);
  });
});

describe("grouperParCategorie", () => {
  const mobile = categorie("m", "Mobile", 1);
  const backend = categorie("k", "Backend", 0);

  it("range les groupes par ordre de categorie, sans categorie en dernier", () => {
    const g = grouperParCategorie([
      article("a", { category: mobile, categoryId: "m" }),
      article("b"),
      article("c", { category: backend, categoryId: "k" }),
      article("d", { category: mobile, categoryId: "m" }),
    ]);
    expect(g.map((x) => x.categorie?.name ?? null)).toEqual(["Backend", "Mobile", null]);
    expect(g[1]!.articles.map((x) => x.id)).toEqual(["a", "d"]);
  });

  it("departage deux categories de meme ordre par leur nom", () => {
    const g = grouperParCategorie([
      article("a", { category: categorie("z", "Zeta"), categoryId: "z" }),
      article("b", { category: categorie("y", "Alpha"), categoryId: "y" }),
    ]);
    expect(g.map((x) => x.categorie?.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("ne cree aucun groupe vide", () => {
    expect(grouperParCategorie([])).toEqual([]);
  });
});

describe("la page du blog filtre en direct", () => {
  let racine: Root;
  let hote: HTMLElement;
  beforeEach(() => {
    hote = document.createElement("div");
    document.body.appendChild(hote);
    racine = createRoot(hote);
  });
  afterEach(() => {
    act(() => racine.unmount());
    hote.remove();
  });

  const articles = [
    article("a", { title: "Flutter vs React Native", category: categorie("m", "Mobile"), categoryId: "m" }),
    article("b", { title: "Spring Boot" }),
  ];
  const titres = () => [...hote.querySelectorAll("h3")].map((h) => h.textContent);
  const groupes = () => [...hote.querySelectorAll("h2")].map((h) => h.textContent);
  function saisir(valeur: string) {
    const champ = hote.querySelector<HTMLInputElement>('input[type="search"]')!;
    // React ecoute `input` et lit la valeur par le descripteur natif.
    const poser = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => {
      poser.call(champ, valeur);
      champ.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("montre les groupes, puis ne garde que ce qui correspond", () => {
    act(() => racine.render(createElement(ExplorateurBlog, { articles })));
    expect(groupes()).toEqual(["Mobile", "Sans catégorie"]);
    expect(hote.querySelector("label")?.textContent).toBe("Rechercher un article");

    saisir("spring");
    expect(titres()).toEqual(["Spring Boot"]);
    expect(groupes()).toEqual(["Sans catégorie"]);
    expect(hote.querySelector('[aria-live="polite"]')?.textContent).toBe("1 article");
  });

  it("dit quand rien ne correspond, et propose d effacer", () => {
    act(() => racine.render(createElement(ExplorateurBlog, { articles })));
    saisir("kotlin");
    expect(titres()).toEqual([]);
    expect(hote.textContent).toContain("Aucun article ne correspond à « kotlin »");
    const effacer = [...hote.querySelectorAll("button")].find((b) => b.textContent === "Effacer la recherche")!;
    act(() => effacer.click());
    expect(titres()).toHaveLength(2);
  });
});
