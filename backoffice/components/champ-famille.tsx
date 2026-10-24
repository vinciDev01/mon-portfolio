"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createEntity, fetchEntities } from "@/lib/api";
import { toast } from "sonner";
import type { TechnologyFamilyDto } from "@portfolio/shared-types";

/** Valeur de l'option qui ouvre la saisie d'une famille neuve. */
const NOUVELLE = "__nouvelle__";

/**
 * La famille d'une technologie, choisie dans la liste geree : aucune faute de
 * frappe ne peut creer une seconde ligne dans le CV. La derniere option
 * enregistre une famille neuve sans quitter le formulaire, et la selectionne.
 * Chaine vide : aucune famille, envoyee `null` a l'API par le formulaire.
 */
export function ChampFamille({
  valeur,
  surChangement,
}: {
  valeur: string;
  surChangement: (familyId: string) => void;
}) {
  const [familles, setFamilles] = useState<TechnologyFamilyDto[]>([]);
  const [saisie, setSaisie] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    fetchEntities<TechnologyFamilyDto>("technology-families")
      .then(setFamilles)
      .catch(() => toast.error("Erreur de chargement des familles"));
  }, []);

  async function enregistrer() {
    const nom = (saisie ?? "").trim();
    if (!nom) return;
    setEnregistrement(true);
    try {
      const famille = await createEntity<TechnologyFamilyDto>("technology-families", {
        name: nom,
        sortOrder: familles.length,
      });
      setFamilles((prev) => [...prev, famille]);
      surChangement(famille.id);
      setSaisie(null);
      toast.success(`Famille « ${famille.name} » enregistrée`);
    } catch (err) {
      // Le nom est unique : l'API dit « Une famille porte deja ce nom ».
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div>
      <label htmlFor="technologie-famille" className="block text-sm font-medium mb-1">
        Famille
      </label>
      <select
        id="technologie-famille"
        value={saisie !== null ? NOUVELLE : valeur}
        onChange={(e) => {
          if (e.target.value === NOUVELLE) {
            setSaisie("");
            return;
          }
          setSaisie(null);
          surChangement(e.target.value);
        }}
        className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
      >
        <option value="">Aucune (« Autres » dans le CV)</option>
        {familles.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
        <option value={NOUVELLE}>Nouvelle famille…</option>
      </select>

      {saisie !== null && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            aria-label="Nom de la nouvelle famille"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={(e) => {
              // Entree enregistre la famille, pas la technologie entiere.
              if (e.key === "Enter") {
                e.preventDefault();
                void enregistrer();
              }
            }}
            maxLength={40}
            autoFocus
            placeholder="Ex. : Langages"
            className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
          />
          <button
            type="button"
            onClick={enregistrer}
            disabled={enregistrement || !saisie.trim()}
            className="px-3 py-2 text-sm rounded-md border border-border hover:bg-accent disabled:opacity-50"
          >
            {enregistrement ? "Enregistrement…" : "Enregistrer la famille"}
          </button>
          <button
            type="button"
            onClick={() => setSaisie(null)}
            className="px-3 py-2 text-sm rounded-md hover:bg-accent"
          >
            Annuler
          </button>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Le CV range les technologies par famille. Les familles se renomment et
        s&apos;ordonnent dans{" "}
        <Link href="/technology-families" className="underline">
          Familles de technologies
        </Link>
        .
      </p>
    </div>
  );
}
