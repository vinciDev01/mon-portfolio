"use client";

import { useEffect, useRef, useState } from "react";
import { appelerApi } from "@/lib/api";

type Resultat = { cle: string; adresse: string | null };

/** La section en cours de saisie, telle que la route d'apercu l'attend. */
export type BrouillonSection = {
  id?: string;
  titre: string;
  lignes: string;
  publique: boolean;
  sortOrder: number;
};

/**
 * L'apercu du CV tel qu'il sera telecharge : le PDF genere par l'API,
 * affiche par le lecteur du navigateur. La route exige le jeton, donc le PDF
 * est recupere puis montre par une adresse `blob:` locale, revoquee quand il
 * est remplace ou quand la page se ferme.
 *
 * `version` : la page l'incremente quand les sections changent (une
 * suppression), et l'apercu se regenere. `brouillon` : la section du
 * formulaire ; l'apercu montre alors le CV tel qu'il sera une fois la section
 * enregistree. Il NE suit PAS la saisie, pour ne pas regenerer le PDF a
 * chaque frappe : il prend le brouillon a l'ouverture, puis a chaque clic sur
 * « Actualiser », et signale quand la saisie a change depuis. L'etat de
 * chargement n'est pas
 * stocke mais deduit : tant que le dernier resultat ne porte pas la cle
 * courante, une generation est en cours.
 */
export function ApercuCv({
  version = 0,
  brouillon,
}: {
  version?: number;
  brouillon?: BrouillonSection;
}) {
  const [relance, setRelance] = useState(0);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const actuelle = useRef<string | null>(null);
  const saisie = brouillon ? JSON.stringify(brouillon) : null;
  // Le brouillon que montre l'apercu : fige a l'ouverture, repris au clic.
  const [corps, setCorps] = useState(saisie);
  const cle = `${version}-${relance}-${corps ?? ""}`;
  const perime = saisie !== corps;

  function actualiser() {
    setCorps(saisie);
    setRelance((n) => n + 1);
  }

  useEffect(() => {
    let annule = false;
    const generer = () =>
      corps
        ? appelerApi("/api/cv-generator/apercu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: corps,
          })
        : appelerApi("/api/cv-generator/generate");
    generer()
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (annule) return;
        if (actuelle.current) URL.revokeObjectURL(actuelle.current);
        actuelle.current = URL.createObjectURL(blob);
        setResultat({ cle, adresse: actuelle.current });
      })
      .catch(() => {
        if (!annule) setResultat({ cle, adresse: null });
      });
    return () => {
      annule = true;
    };
  }, [cle, corps]);

  // A la fermeture de la page, la derniere adresse est liberee.
  useEffect(
    () => () => {
      if (actuelle.current) URL.revokeObjectURL(actuelle.current);
    },
    [],
  );

  const enCours = resultat?.cle !== cle;
  const erreur = !enCours && resultat?.adresse === null;
  // Pendant une regeneration, l'apercu precedent reste affiche.
  const adresse = resultat?.adresse ?? null;

  return (
    <section aria-labelledby="apercu-cv-titre" className="flex flex-col h-full min-h-[600px]">
      <div className="flex items-center justify-between mb-3">
        <h2 id="apercu-cv-titre" className="text-sm font-semibold">
          Aperçu du CV
        </h2>
        <button
          type="button"
          onClick={actualiser}
          disabled={enCours}
          className="text-xs px-3 py-1 rounded border border-border hover:bg-accent disabled:opacity-50"
        >
          {enCours ? "Génération…" : "Actualiser"}
        </button>
      </div>
      {perime && !enCours && (
        <p role="status" className="text-xs text-muted-foreground mb-3">
          Vos modifications ne sont pas encore dans l&apos;aperçu. Cliquez sur
          « Actualiser » pour les voir.
        </p>
      )}
      <div className="relative flex-1 rounded-md border border-border bg-muted overflow-hidden">
        {erreur ? (
          <p className="p-6 text-sm text-muted-foreground">
            L&apos;aperçu n&apos;a pas pu être généré. Cliquez sur « Actualiser » pour
            réessayer.
          </p>
        ) : (
          adresse && (
            <iframe
              src={adresse}
              title="Aperçu du CV au format PDF"
              className="absolute inset-0 w-full h-full"
            />
          )
        )}
      </div>
    </section>
  );
}
