import { NextResponse } from "next/server";
import type { SiteSettingsDto } from "@portfolio/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Sert le CV dans le format demande.
 *
 * Deux sources, dans cet ordre : le fichier televerse depuis le backoffice
 * prime s'il existe — c'est la porte de sortie quand on veut publier une
 * version relue a la main — sinon on sert le document genere depuis la base,
 * qui a l'avantage d'etre toujours a jour.
 *
 * Le televersement manuel ne concerne que le PDF : il n'y a qu'un champ
 * `cvFilePath`. Le Word vient donc toujours du generateur.
 */
export async function servirCv(format: "pdf" | "docx"): Promise<NextResponse> {
  try {
    if (format === "pdf") {
      const reglagesRes = await fetch(`${API_URL}/api/site-settings`, {
        cache: "no-store",
      });
      if (reglagesRes.ok) {
        const reglages = (await reglagesRes.json()) as SiteSettingsDto;
        if (reglages.cvFilePath) {
          const fichierRes = await fetch(
            `${API_URL}/uploads/${reglages.cvFilePath}`,
          );
          if (fichierRes.ok) {
            return new NextResponse(await fichierRes.blob(), {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="CV.pdf"',
              },
            });
          }
          // Le fichier est reference mais introuvable : plutot que de renvoyer
          // une erreur, on retombe sur le document genere.
        }
      }
    }

    const chemin = format === "pdf" ? "generate" : "generate.docx";
    const genereRes = await fetch(`${API_URL}/api/cv-generator/${chemin}`, {
      cache: "no-store",
    });
    if (!genereRes.ok) {
      return NextResponse.json(
        { error: "CV indisponible" },
        { status: 502 },
      );
    }

    // On relaie le type et le nom de fichier decides par le generateur.
    return new NextResponse(await genereRes.blob(), {
      headers: {
        "Content-Type":
          genereRes.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition":
          genereRes.headers.get("content-disposition") ??
          `attachment; filename="CV.${format}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
