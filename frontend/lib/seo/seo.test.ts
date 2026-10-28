import { describe, expect, it } from "vitest";
import type { PortfolioData } from "@portfolio/shared-types";
import { absolue, enJsonLd, fichePersonne, ficheSite, urlDuSite } from "./seo";

const data = {
  personalInfo: {
    name: "BENYO",
    surname: "Fanuel Kokou",
    email: "a@b.c",
    linkedinUrl: "https://www.linkedin.com/in/fanuel",
    githubUrl: "javascript:alert(1)",
    avatarPath: null,
  },
  siteSettings: { cvJobTitle: "Ingénieur Logiciel", seoTitle: "Fanuel BENYO" },
  presentations: [{ title: "Titre de présentation" }],
  experiences: [{ isCurrent: true, company: "OssanAsur", role: "Ingénieur" }],
  skills: [{ technology: { label: "Java" }, label: null }, { technology: null, label: "Management" }],
} as unknown as PortfolioData;

describe("referencement", () => {
  it("l adresse du site : celle du backoffice, sans barre finale, sinon le repli", () => {
    expect(urlDuSite({ siteUrl: "https://fanu.dev/" })).toBe("https://fanu.dev");
    expect(urlDuSite({ siteUrl: null })).toMatch(/^http/);
    expect(absolue("/og", "https://fanu.dev")).toBe("https://fanu.dev/og");
    expect(absolue("https://x.y/i.png", "https://fanu.dev")).toBe("https://x.y/i.png");
  });

  it("la fiche Personne : nom, poste, employeur, competences, profils surs seulement", () => {
    const f = fichePersonne(data, "https://fanu.dev", "https://api/u.webp");
    expect(f).toMatchObject({
      "@type": "Person",
      name: "BENYO Fanuel Kokou",
      url: "https://fanu.dev",
      jobTitle: "Ingénieur Logiciel",
      image: "https://api/u.webp",
      email: "mailto:a@b.c",
      worksFor: { "@type": "Organization", name: "OssanAsur" },
      knowsAbout: ["Java", "Management"],
    });
    // Seuls les liens https entrent dans sameAs.
    expect(f.sameAs).toEqual(["https://www.linkedin.com/in/fanuel"]);
  });

  it("la fiche Site web", () => {
    expect(ficheSite(data, "https://fanu.dev")).toMatchObject({ "@type": "WebSite", name: "Fanuel BENYO", url: "https://fanu.dev" });
  });

  it("le JSON-LD ne peut pas fermer sa balise script", () => {
    const j = enJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(j).not.toContain("</script>");
    expect(JSON.parse(j).name).toBe("</script><script>alert(1)</script>");
  });
});
