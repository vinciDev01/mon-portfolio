import { NextResponse } from "next/server";
import type { SiteSettingsDto } from "@portfolio/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET() {
  try {
    const settingsRes = await fetch(`${API_URL}/api/site-settings`);
    if (!settingsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch site settings" },
        { status: 502 },
      );
    }

    const settings = (await settingsRes.json()) as SiteSettingsDto;

    if (!settings.cvFilePath) {
      return NextResponse.json({ error: "No CV available" }, { status: 404 });
    }

    const fileRes = await fetch(`${API_URL}/uploads/${settings.cvFilePath}`);
    if (!fileRes.ok) {
      return NextResponse.json({ error: "CV file not found" }, { status: 404 });
    }

    const blob = await fileRes.blob();

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="CV.pdf"',
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
