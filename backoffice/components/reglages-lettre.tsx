"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { appelerApi, updateSingleton } from "@/lib/api";

const champ = "w-full px-3 py-2 border border-border rounded-md text-sm";

/**
 * L'en-tete des lettres de motivation, commun a toutes : une ligne par
 * information, la premiere (le nom) en gras. Tant que rien n'est enregistre,
 * le champ propose celui deduit des informations personnelles ; « Revenir a
 * l'en-tete par defaut » efface le texte saisi, et l'en-tete suit de nouveau
 * ces informations.
 */
export function ReglagesLettre() {
  const [enregistre, setEnregistre] = useState<string | null>(null);
  const [parDefaut, setParDefaut] = useState("");
  const [texte, setTexte] = useState("");
  const [charge, setCharge] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    appelerApi("/api/cv-generator/lettre/en-tete")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { enTete: string | null; parDefaut: string }) => {
        setEnregistre(j.enTete);
        setParDefaut(j.parDefaut);
        setTexte(j.enTete ?? j.parDefaut);
        setCharge(true);
      })
      .catch(() => toast.error("Erreur de chargement de l'en-tête des lettres"));
  }, []);

  async function enregistrer(valeur: string | null, message: string) {
    setSaving(true);
    try {
      await updateSingleton("site-settings", { lettreEnTete: valeur });
      setEnregistre(valeur);
      setTexte(valeur ?? parDefaut);
      toast.success(message);
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (!charge) return null;

  const modifie = texte.trim() !== (enregistre ?? parDefaut).trim();

  return (
    <fieldset className="mb-8 max-w-2xl border border-border rounded-md p-4 space-y-3">
      <legend className="text-sm font-semibold px-2">En-tête des lettres</legend>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enregistrer(texte.trim() || null, "En-tête des lettres enregistré");
        }}
      >
        <label htmlFor="lettre-en-tete" className="block text-sm font-medium mb-1">
          En-tête commun
        </label>
        <textarea
          id="lettre-en-tete"
          rows={5}
          maxLength={600}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          className={`${champ} font-mono`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          En haut à gauche de chaque lettre, une ligne par information ; la première, votre nom, en gras.
          {enregistre === null && " Proposé depuis vos informations personnelles tant que vous ne l'avez pas modifié."}
          {" "}Le destinataire, l&apos;objet et le corps se rédigent dans chaque lettre.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving || !modifie}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            Enregistrer
          </button>
          {enregistre !== null && (
            <button
              type="button"
              disabled={saving}
              onClick={() => enregistrer(null, "En-tête par défaut rétabli")}
              className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
            >
              Revenir à l&apos;en-tête par défaut
            </button>
          )}
        </div>
      </form>
    </fieldset>
  );
}
