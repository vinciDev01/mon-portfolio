"use client";

import { useEffect, useState } from "react";
import { fetchEntities } from "@/lib/api";
import type { TechnologyDto } from "@portfolio/shared-types";

/**
 * La famille d'une technologie (Langages, Frameworks, Outils...). Texte libre,
 * mais le champ propose les familles deja saisies : « Outils » choisi dans la
 * liste evite un « outils » qui creerait une seconde ligne dans le CV.
 */
export function ChampFamille({
  valeur,
  surChangement,
}: {
  valeur: string;
  surChangement: (famille: string) => void;
}) {
  const [familles, setFamilles] = useState<string[]>([]);

  useEffect(() => {
    fetchEntities<TechnologyDto>("technologies")
      .then((techs) =>
        setFamilles(
          [...new Set(techs.map((t) => t.family?.trim()).filter((f): f is string => Boolean(f)))].sort(
            (a, b) => a.localeCompare(b, "fr"),
          ),
        ),
      )
      .catch(() => {});
  }, []);

  return (
    <div>
      <label htmlFor="technologie-famille" className="block text-sm font-medium mb-1">
        Famille
      </label>
      <input
        id="technologie-famille"
        type="text"
        list="familles-existantes"
        value={valeur}
        onChange={(e) => surChangement(e.target.value)}
        maxLength={40}
        placeholder="Ex. : Langages, Frameworks, Outils"
        className="w-full px-3 py-2 border border-border rounded-md text-sm"
      />
      <datalist id="familles-existantes">
        {familles.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      <p className="text-xs text-muted-foreground mt-1">
        Le CV range les technologies par famille. Laissée vide, la technologie va sous « Autres ».
      </p>
    </div>
  );
}
