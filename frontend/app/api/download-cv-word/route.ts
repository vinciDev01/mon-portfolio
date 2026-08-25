import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Seul format propose au public : le Word.
 *
 * Le backend refuse la ressource quand la case « CV telechargeable » n'est
 * pas cochee ; on relaie alors son 404 tel quel plutot que d'inventer une
 * autre reponse.
 */
export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/cv-generator/public.docx`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "CV indisponible" },
        { status: res.status === 404 ? 404 : 502 },
      );
    }

    // On relaie le type et le nom de fichier decides par le generateur.
    return new NextResponse(await res.blob(), {
      headers: {
        "Content-Type":
          res.headers.get("content-type") ?? "application/octet-stream",
        "Content-Disposition":
          res.headers.get("content-disposition") ??
          'attachment; filename="CV.docx"',
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
