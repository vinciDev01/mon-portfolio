"use client";

import { useEffect, useRef, useState } from "react";
import { appelerApi } from "@/lib/api";

/** La lettre en cours de saisie, telle que la route d'apercu l'attend. */
export type BrouillonLettre = {
  langue: "fr" | "en";
  destinataire: string | null;
  lieu: string | null;
  date: string | null;
  objet: string | null;
  sections: { titre: string | null; corps: string }[];
};

type Resultat = {
  cle: string;
  adresse: string | null;
  pages: number;
  corps: number | null;
  /** Rien a montrer : aucune section n'a encore de texte. */
  vide: boolean;
};

/** Le temps d'attente apres la derniere frappe avant de regenerer. */
const ATTENTE_MS = 700;

/**
 * L'apercu de la lettre telle qu'elle sera telechargee : le PDF genere par
 * l'API depuis la saisie, sans rien enregistrer, affiche par le lecteur du
 * navigateur. Il suit la saisie, un court instant apres la derniere frappe ;
 * la generation precedente reste affichee pendant la suivante.
 *
 * Sous le PDF : la taille retenue pour tenir sur une page, ou un
 * avertissement quand la lettre deborde meme resserree au maximum.
 */
export function ApercuLettre({ brouillon }: { brouillon: BrouillonLettre }) {
  const saisie = JSON.stringify(brouillon);
  const [cle, setCle] = useState(saisie);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const actuelle = useRef<string | null>(null);

  // La saisie ne part qu'une fois la frappe arretee.
  useEffect(() => {
    const t = setTimeout(() => setCle(saisie), ATTENTE_MS);
    return () => clearTimeout(t);
  }, [saisie]);

  useEffect(() => {
    let annule = false;
    appelerApi("/api/cv-generator/lettre/apercu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: cle,
    })
      .then(async (res) => {
        if (res.status === 404) {
          if (!annule) setResultat({ cle, adresse: null, pages: 0, corps: null, vide: true });
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (annule) return;
        if (actuelle.current) URL.revokeObjectURL(actuelle.current);
        actuelle.current = URL.createObjectURL(blob);
        const corps = Number(res.headers.get("X-Lettre-Corps"));
        setResultat({
          cle,
          adresse: actuelle.current,
          pages: Number(res.headers.get("X-Lettre-Pages")) || 1,
          corps: Number.isFinite(corps) && corps > 0 ? corps : null,
          vide: false,
        });
      })
      .catch(() => {
        if (!annule) setResultat({ cle, adresse: null, pages: 0, corps: null, vide: false });
      });
    return () => {
      annule = true;
    };
  }, [cle]);

  // A la fermeture de la page, la derniere adresse est liberee.
  useEffect(
    () => () => {
      if (actuelle.current) URL.revokeObjectURL(actuelle.current);
    },
    [],
  );

  const enCours = resultat?.cle !== saisie;
  const adresse = resultat?.adresse ?? null;

  return (
    <section aria-labelledby="apercu-lettre-titre" className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h2 id="apercu-lettre-titre" className="text-sm font-semibold">
          Aperçu
        </h2>
        <p role="status" className="text-xs text-muted-foreground">
          {enCours
            ? "Mise à jour…"
            : resultat?.pages === 1 && resultat.corps
              ? `Tient sur une page, texte en ${String(resultat.corps).replace(".", ",")} pt`
              : ""}
        </p>
      </div>
      {!enCours && resultat && resultat.pages > 1 && (
        <p role="alert" className="text-xs mb-2 px-3 py-2 rounded border border-destructive text-destructive">
          Trop longue : {resultat.pages} pages même avec le texte réduit au minimum. Raccourcissez-la pour qu&apos;elle
          tienne sur une page.
        </p>
      )}
      <div className="relative flex-1 min-h-[70vh] rounded-md border border-border bg-muted overflow-hidden">
        {resultat?.vide ? (
          <p className="p-6 text-sm text-muted-foreground">
            L&apos;aperçu apparaîtra dès qu&apos;une section aura du texte.
          </p>
        ) : resultat && !resultat.adresse && !enCours ? (
          <p className="p-6 text-sm text-muted-foreground">L&apos;aperçu n&apos;a pas pu être généré.</p>
        ) : (
          adresse && (
            <iframe
              src={`${adresse}#toolbar=0&view=FitH`}
              title="Aperçu de la lettre au format PDF"
              className="absolute inset-0 w-full h-full"
            />
          )
        )}
      </div>
    </section>
  );
}
