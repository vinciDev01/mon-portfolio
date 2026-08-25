import { servirCv } from "@/lib/cv-telechargement";

export async function GET() {
  return servirCv("docx");
}
