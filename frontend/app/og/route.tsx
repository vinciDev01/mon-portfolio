import { ImageResponse } from "next/og";
import { getPortfolioData } from "@/lib/api";
import { urlDuSite } from "@/lib/seo/seo";

/**
 * L'image d'apercu du site (1200 x 630), quand aucune n'est choisie au
 * backoffice : le nom, le poste et l'adresse, aux couleurs claires du site.
 * C'est elle qu'affichent LinkedIn, WhatsApp ou X sous un lien partage.
 */
export const revalidate = 3600;

export async function GET() {
  let nom = "Portfolio";
  let poste = "";
  let site = urlDuSite(null);
  try {
    const data = await getPortfolioData();
    nom = `${data.personalInfo.name} ${data.personalInfo.surname}`.trim() || nom;
    poste = data.siteSettings.cvJobTitle?.trim() || data.presentations[0]?.title || "";
    site = urlDuSite(data.siteSettings);
  } catch {
    // API injoignable : l'apercu reste generique plutot que de manquer.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "#f6f1e8",
          color: "#1f2320",
        }}
      >
        <div style={{ width: 96, height: 10, background: "#456040", marginBottom: 48 }} />
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>{nom}</div>
        {poste && <div style={{ fontSize: 40, marginTop: 24, color: "#5e564a" }}>{poste}</div>}
        <div style={{ fontSize: 30, marginTop: 64, color: "#456040" }}>{site.replace(/^https?:\/\//, "")}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
