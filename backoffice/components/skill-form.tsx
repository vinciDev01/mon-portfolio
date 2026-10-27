"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchEntities } from "@/lib/api";
import type { SkillDto, TechnologyDto, TechnologyFamilyDto } from "@portfolio/shared-types";

export type ValeursCompetence = {
  sorte: "technologie" | "libre";
  technologyId: string;
  label: string;
  familyId: string;
  proficiency: number | "";
  sortOrder: number;
};

export const COMPETENCE_VIDE: ValeursCompetence = {
  sorte: "technologie",
  technologyId: "",
  label: "",
  familyId: "",
  proficiency: "",
  sortOrder: 0,
};

export function valeursDe(s: SkillDto): ValeursCompetence {
  return {
    sorte: s.technologyId ? "technologie" : "libre",
    technologyId: s.technologyId ?? "",
    label: s.label ?? "",
    familyId: s.familyId ?? "",
    proficiency: s.proficiency ?? "",
    sortOrder: s.sortOrder,
  };
}

/** Le corps envoye a l'API : une technologie, ou un nom et sa famille. */
export function corpsCompetence(v: ValeursCompetence) {
  const commun = { proficiency: v.proficiency === "" ? null : v.proficiency, sortOrder: v.sortOrder };
  return v.sorte === "technologie"
    ? { ...commun, technologyId: v.technologyId, label: null, familyId: null }
    : { ...commun, technologyId: null, label: v.label.trim(), familyId: v.familyId || null };
}

/** Le message d'erreur du formulaire, ou null s'il peut partir. */
export function erreurCompetence(v: ValeursCompetence): string | null {
  if (v.sorte === "technologie" && !v.technologyId) return "Sélectionnez une technologie";
  if (v.sorte === "libre" && !v.label.trim()) return "Saisissez le nom de la compétence";
  return null;
}

const champ = "w-full px-3 py-2 border border-border rounded-md text-sm bg-background";

/**
 * Le formulaire d'une competence, partage par la creation et la
 * modification. Une competence est technique, liee a une technologie dont
 * elle prend le nom, le logo et la famille ; ou libre, comme le management,
 * avec son nom et sa famille choisie dans la liste geree.
 */
export function SkillForm({
  valeurs,
  onChange,
}: {
  valeurs: ValeursCompetence;
  onChange: (v: ValeursCompetence) => void;
}) {
  const [technologies, setTechnologies] = useState<TechnologyDto[]>([]);
  const [familles, setFamilles] = useState<TechnologyFamilyDto[]>([]);

  useEffect(() => {
    Promise.all([
      fetchEntities<TechnologyDto>("technologies"),
      fetchEntities<TechnologyFamilyDto>("technology-families"),
    ])
      .then(([t, f]) => {
        setTechnologies(t);
        setFamilles(f);
      })
      .catch(() => toast.error("Erreur de chargement des listes"));
  }, []);

  const maj = <K extends keyof ValeursCompetence>(cle: K, v: ValeursCompetence[K]) => onChange({ ...valeurs, [cle]: v });

  return (
    <>
      <fieldset>
        <legend className="block text-sm font-medium mb-2">Type de compétence</legend>
        <div className="flex flex-wrap gap-3">
          {([
            { valeur: "technologie", titre: "Technologie", aide: "Java, Docker… : nom, logo et famille viennent de la technologie" },
            { valeur: "libre", titre: "Compétence libre", aide: "Management, gestion de projet… : nom et famille à saisir" },
          ] as const).map((o) => (
            <label
              key={o.valeur}
              className={`flex-1 min-w-[200px] cursor-pointer rounded-md border p-3 text-sm ${
                valeurs.sorte === o.valeur ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="sorte-competence"
                  value={o.valeur}
                  checked={valeurs.sorte === o.valeur}
                  onChange={() => maj("sorte", o.valeur)}
                />
                {o.titre}
              </span>
              <span className="block text-xs text-muted-foreground mt-1">{o.aide}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {valeurs.sorte === "technologie" ? (
        <div>
          <label htmlFor="competence-techno" className="block text-sm font-medium mb-1">Technologie</label>
          <select
            id="competence-techno"
            value={valeurs.technologyId}
            onChange={(e) => maj("technologyId", e.target.value)}
            className={champ}
          >
            <option value="">-- Sélectionner --</option>
            {technologies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
                {t.family ? ` (${t.family.name})` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="competence-nom" className="block text-sm font-medium mb-1">Nom</label>
            <input
              id="competence-nom"
              type="text"
              maxLength={80}
              value={valeurs.label}
              onChange={(e) => maj("label", e.target.value)}
              placeholder="Ex : Management"
              className={champ}
            />
          </div>
          <div>
            <label htmlFor="competence-famille" className="block text-sm font-medium mb-1">Famille</label>
            <select
              id="competence-famille"
              value={valeurs.familyId}
              onChange={(e) => maj("familyId", e.target.value)}
              className={champ}
            >
              <option value="">Autres</option>
              {familles.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">La rangée où elle s&apos;affiche sur le site.</p>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="competence-niveau" className="block text-sm font-medium mb-1">Niveau (0-100)</label>
        <input
          id="competence-niveau"
          type="number"
          min={0}
          max={100}
          value={valeurs.proficiency}
          onChange={(e) => maj("proficiency", e.target.value === "" ? "" : Number(e.target.value))}
          className={champ}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Affiché en pierres : une sous 60, deux de 60 à 79, trois à partir de 80. Vide : aucune.
        </p>
      </div>
      <div>
        <label htmlFor="competence-ordre" className="block text-sm font-medium mb-1">Ordre</label>
        <input
          id="competence-ordre"
          type="number"
          min={0}
          value={valeurs.sortOrder}
          onChange={(e) => maj("sortOrder", Number(e.target.value))}
          className={champ}
        />
        <p className="text-xs text-muted-foreground mt-1">Ordre dans sa rangée.</p>
      </div>
    </>
  );
}
