"use client";

import { useEffect, useState } from "react";
import { fetchSingleton, updateSingleton } from "@/lib/api";
import { toast } from "sonner";
import type { SiteSettingsDto } from "@portfolio/shared-types";

/**
 * Le poste vise, imprime sous le nom en tete du CV. Il vit dans les reglages
 * du site, a cote des autres reglages du CV ; vide, le CV n'a pas de ligne.
 * `surEnregistrement` : la page regenere alors l'apercu.
 */
export function TitrePosteCv({ surEnregistrement }: { surEnregistrement: () => void }) {
  const [titre, setTitre] = useState("");
  const [enregistre, setEnregistre] = useState("");
  // La version anglaise, pour le CV en anglais ; vide : le francais.
  const [titreEn, setTitreEn] = useState("");
  const [enregistreEn, setEnregistreEn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSingleton<SiteSettingsDto>("site-settings")
      .then((r) => {
        setTitre(r.cvJobTitle ?? "");
        setEnregistre(r.cvJobTitle ?? "");
        setTitreEn(r.cvJobTitleEn ?? "");
        setEnregistreEn(r.cvJobTitleEn ?? "");
      })
      .catch(() => toast.error("Erreur de chargement du titre du poste"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const valeur = titre.trim();
      const valeurEn = titreEn.trim();
      await updateSingleton("site-settings", { cvJobTitle: valeur || null, cvJobTitleEn: valeurEn || null });
      setTitre(valeur);
      setEnregistre(valeur);
      setTitreEn(valeurEn);
      setEnregistreEn(valeurEn);
      toast.success(valeur ? "Titre du poste enregistré" : "Titre du poste retiré du CV");
      surEnregistrement();
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 max-w-2xl">
      <label htmlFor="cv-titre-poste" className="block text-sm font-medium mb-1">
        Titre du poste
      </label>
      <div className="flex gap-2">
        <input
          id="cv-titre-poste"
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          maxLength={120}
          placeholder="Ex. : Développeur Java Spring Boot"
          className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
        />
        <button
          type="submit"
          disabled={saving || (titre.trim() === enregistre && titreEn.trim() === enregistreEn)}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
      <label htmlFor="cv-titre-poste-en" className="block text-sm font-medium mt-3 mb-1">
        Titre du poste (anglais)
      </label>
      <input
        id="cv-titre-poste-en"
        type="text"
        value={titreEn}
        onChange={(e) => setTitreEn(e.target.value)}
        maxLength={120}
        placeholder="Ex. : Java Spring Boot Developer"
        className="w-full px-3 py-2 border border-border rounded-md text-sm"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Le poste auquel vous postulez, imprimé sous votre nom en tête du CV.
        Laissé vide, le CV n&apos;a pas de ligne de titre. Le titre anglais, s&apos;il est vide, reprend le français.
      </p>
    </form>
  );
}
