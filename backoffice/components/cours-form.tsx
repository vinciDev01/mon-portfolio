"use client";

import { useEffect, useState } from "react";
import { fetchEntities, uploadCoursPdf } from "@/lib/api";
import { toast } from "sonner";
import type { TechnologyDto } from "@portfolio/shared-types";

export type ValeursCours = {
  titre: string;
  titreCourt: string;
  description: string;
  niveau: "debutant" | "intermediaire" | "avance";
  pages: string;
  fichier: string;
  taille: number;
  technologyId: string;
  publique: boolean;
  sortOrder: number;
};

export const COURS_VIDE: ValeursCours = {
  titre: "",
  titreCourt: "",
  description: "",
  niveau: "debutant",
  pages: "",
  fichier: "",
  taille: 0,
  technologyId: "",
  // Masque par defaut : un cours a moitie decrit n'apparait pas sur le site.
  publique: false,
  sortOrder: 0,
};

/** Le corps envoye a l'API : les champs vides deviennent `null`. */
export function corpsCours(v: ValeursCours) {
  return {
    titre: v.titre.trim(),
    titreCourt: v.titreCourt.trim() || null,
    description: v.description.trim() || null,
    niveau: v.niveau,
    pages: v.pages ? Number(v.pages) : null,
    fichier: v.fichier,
    taille: v.taille,
    technologyId: v.technologyId,
    publique: v.publique,
    sortOrder: v.sortOrder,
  };
}

const NIVEAUX = [
  { valeur: "debutant", libelle: "Débutant" },
  { valeur: "intermediaire", libelle: "Intermédiaire" },
  { valeur: "avance", libelle: "Avancé" },
] as const;

const champ = "w-full px-3 py-2 border border-border rounded-md text-sm";

/** « 2,4 Mo », ou « 600 Ko » sous le mega-octet : un petit PDF ne doit pas
 *  s'afficher « 0 Mo ». */
function mo(octets: number): string {
  const enMo = octets / (1024 * 1024);
  return enMo >= 1
    ? `${enMo.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(octets / 1024)).toLocaleString("fr-FR")} Ko`;
}

/**
 * Le formulaire d'un cours, partage par la creation et la modification. Le
 * PDF part des qu'il est choisi : l'API le verifie, le range hors du dossier
 * public, et rend sa taille et ses pages, que le formulaire reprend (les
 * pages restent modifiables, au cas ou la lecture aurait echoue).
 */
export function CoursForm({
  valeurs,
  onChange,
}: {
  valeurs: ValeursCours;
  onChange: (v: ValeursCours) => void;
}) {
  const [techs, setTechs] = useState<TechnologyDto[]>([]);
  const [envoi, setEnvoi] = useState(false);
  // Le nom du fichier choisi, pour l'afficher ; absent en modification, ou
  // seul le PDF deja en place est connu.
  const [nomChoisi, setNomChoisi] = useState<string | null>(null);
  const [survol, setSurvol] = useState(false);

  useEffect(() => {
    fetchEntities<TechnologyDto>("technologies")
      .then(setTechs)
      .catch(() => toast.error("Erreur de chargement des technologies"));
  }, []);

  async function choisirPdf(fichier: File | undefined) {
    if (!fichier) return;
    if (fichier.type && fichier.type !== "application/pdf") {
      toast.error("Seuls les fichiers PDF sont acceptés");
      return;
    }
    setEnvoi(true);
    try {
      const r = await uploadCoursPdf(fichier);
      onChange({
        ...valeurs,
        fichier: r.fichier,
        taille: r.taille,
        // Pages lues dans le NOUVEAU PDF, ou rien a saisir : garder celles de
        // l'ancien afficherait un faux nombre de pages sur le site.
        pages: r.pages ? String(r.pages) : "",
      });
      setNomChoisi(fichier.name);
      toast.success(r.pages ? `PDF envoyé : ${r.pages} pages` : "PDF envoyé ; pages à saisir");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Echec de l'envoi du PDF");
    } finally {
      setEnvoi(false);
    }
  }

  const maj = <K extends keyof ValeursCours>(cle: K, v: ValeursCours[K]) => onChange({ ...valeurs, [cle]: v });

  return (
    <>
      <div>
        <span className="block text-sm font-medium mb-1">Fichier PDF</span>
        {/* La zone entiere est l'etiquette du champ : un clic l'ouvre, et le
            champ, masque a l'oeil mais pas au clavier, prend le focus avec
            Tab ; la zone se marque alors. Un PDF peut aussi y etre glisse. */}
        <label
          htmlFor="cours-pdf"
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            void choisirPdf(e.dataTransfer.files?.[0]);
          }}
          className={`flex items-center gap-4 rounded-lg border-2 border-dashed p-4 min-h-[96px] transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
            envoi ? "cursor-progress opacity-70" : "cursor-pointer"
          } ${survol ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`size-10 shrink-0 ${valeurs.fichier ? "text-primary" : "text-muted-foreground"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6M9 17h4" />
          </svg>
          <span className="flex flex-col gap-0.5 min-w-0">
            {envoi ? (
              <span className="text-sm font-medium">Envoi en cours…</span>
            ) : valeurs.fichier ? (
              <>
                <span className="text-sm font-medium truncate">{nomChoisi ?? "PDF en place"}</span>
                <span className="text-xs text-muted-foreground">
                  {mo(valeurs.taille)}
                  {valeurs.pages ? ` · ${valeurs.pages} pages` : ""}
                  {" · "}cliquez ou glissez un autre PDF pour le remplacer
                </span>
              </>
            ) : (
              <>
                <span className="text-sm font-medium">Glissez un PDF ici ou cliquez pour choisir</span>
                <span className="text-xs text-muted-foreground">PDF uniquement, 50 Mo au plus</span>
              </>
            )}
          </span>
          <input
            id="cours-pdf"
            type="file"
            accept="application/pdf"
            disabled={envoi}
            onChange={(e) => {
              void choisirPdf(e.target.files?.[0]);
              // Rechoisir le meme fichier doit relancer l'envoi.
              e.target.value = "";
            }}
            className="sr-only"
          />
        </label>
      </div>
      <div>
        <label htmlFor="cours-titre" className="block text-sm font-medium mb-1">Titre</label>
        <input id="cours-titre" type="text" required maxLength={160} value={valeurs.titre} onChange={(e) => maj("titre", e.target.value)} className={champ} />
      </div>
      <div>
        <label htmlFor="cours-titre-court" className="block text-sm font-medium mb-1">Titre court</label>
        <input id="cours-titre-court" type="text" maxLength={40} value={valeurs.titreCourt} onChange={(e) => maj("titreCourt", e.target.value)} className={champ} />
        <p className="text-xs text-muted-foreground mt-1">Affiché sur la tranche du livre si le titre est trop long.</p>
      </div>
      <div>
        <label htmlFor="cours-description" className="block text-sm font-medium mb-1">Description</label>
        <textarea id="cours-description" rows={4} value={valeurs.description} onChange={(e) => maj("description", e.target.value)} className={champ} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cours-techno" className="block text-sm font-medium mb-1">Technologie</label>
          <select id="cours-techno" required value={valeurs.technologyId} onChange={(e) => maj("technologyId", e.target.value)} className={`${champ} bg-background`}>
            <option value="">Choisir…</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {t.family ? ` (${t.family.name})` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Sa famille décide de la planche de l&apos;étagère.</p>
        </div>
        <div>
          <label htmlFor="cours-niveau" className="block text-sm font-medium mb-1">Niveau</label>
          <select id="cours-niveau" value={valeurs.niveau} onChange={(e) => maj("niveau", e.target.value as ValeursCours["niveau"])} className={`${champ} bg-background`}>
            {NIVEAUX.map((n) => (
              <option key={n.valeur} value={n.valeur}>{n.libelle}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cours-pages" className="block text-sm font-medium mb-1">Pages</label>
          <input id="cours-pages" type="number" min={1} value={valeurs.pages} onChange={(e) => maj("pages", e.target.value)} className={champ} />
        </div>
        <div>
          <label htmlFor="cours-ordre" className="block text-sm font-medium mb-1">Ordre</label>
          <input id="cours-ordre" type="number" min={0} value={valeurs.sortOrder} onChange={(e) => maj("sortOrder", Number(e.target.value))} className={champ} />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={valeurs.publique} onChange={(e) => maj("publique", e.target.checked)} className="mt-0.5" />
        <span>
          <span className="font-medium">Public</span>
          <span className="block text-xs text-muted-foreground">
            Décoché, le cours n&apos;apparaît pas sur l&apos;étagère et ne se télécharge pas.
          </span>
        </span>
      </label>
    </>
  );
}
