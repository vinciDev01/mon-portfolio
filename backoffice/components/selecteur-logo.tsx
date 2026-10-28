"use client";

import { useEffect, useRef, useState } from "react";
import { fetchEntities } from "@/lib/api";

/** Un logo du catalogue tel que l'API le rend : `exact` quand il porte
 *  exactement le nom cherche. */
export type LogoCatalogue = { slug: string; title: string; hex: string; trace: string; exact: boolean };

/** Le logo retenu : son identifiant, et de quoi le montrer. */
export type LogoChoisi = { slug: string; title: string; trace: string } | null;

/** La couleur de marque, sauf si elle est presque blanche : invisible sur le
 *  fond blanc du backoffice, le logo prend alors la couleur du texte. */
function couleurLisible(hex: string): string | undefined {
  const n = parseInt(hex, 16);
  if (Number.isNaN(n)) return undefined;
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 210 ? undefined : `#${hex}`;
}

function Trace({ trace, couleur, taille = 28 }: { trace: string; couleur?: string; taille?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={taille} height={taille} aria-hidden="true" fill={couleur ?? "currentColor"}>
      <path d={trace} />
    </svg>
  );
}

/**
 * Le choix du logo d'une technologie dans le catalogue (Simple Icons) : on
 * ne stocke que son identifiant, aucune image. La recherche suit le libelle
 * saisi au-dessus ; un champ propre permet de chercher un autre nom. A la
 * creation (`automatique`), le logo qui porte exactement le libelle est
 * choisi d'office tant qu'on n'a rien choisi a la main.
 */
export function SelecteurLogo({
  libelle,
  choisi,
  surChoix,
  automatique = false,
}: {
  libelle: string;
  choisi: LogoChoisi;
  surChoix: (logo: LogoChoisi) => void;
  automatique?: boolean;
}) {
  const [recherche, setRecherche] = useState(libelle);
  // Tant qu'on n'a pas tape dans le champ du selecteur, il suit le libelle.
  const [libre, setLibre] = useState(false);
  const [resultats, setResultats] = useState<LogoCatalogue[]>([]);
  const [chargement, setChargement] = useState(false);
  const touche = useRef(false);

  const q = (libre ? recherche : libelle).trim();

  useEffect(() => {
    if (!q) {
      setResultats([]);
      return;
    }
    const minuterie = setTimeout(() => {
      setChargement(true);
      fetchEntities<LogoCatalogue>(`logos?q=${encodeURIComponent(q)}`)
        .then((r) => {
          setResultats(r);
          const exact = r.find((l) => l.exact);
          if (automatique && !touche.current && exact) {
            surChoix({ slug: exact.slug, title: exact.title, trace: exact.trace });
          }
        })
        .catch(() => setResultats([]))
        .finally(() => setChargement(false));
    }, 250);
    return () => clearTimeout(minuterie);
    // `surChoix` change a chaque rendu du parent : seule la saisie relance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, automatique]);

  const choisir = (logo: LogoChoisi) => {
    touche.current = true;
    surChoix(logo);
  };

  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-1">Logo</legend>
      <p className="text-xs text-muted-foreground mb-2">
        Choisi dans le catalogue Simple Icons : seul son nom est enregistré, aucune image n&apos;est stockée.
      </p>

      <div className="flex items-center gap-3 mb-3 min-h-[44px]">
        {choisi ? (
          <>
            <span className="grid place-items-center size-11 rounded-md border border-border">
              <Trace trace={choisi.trace} />
            </span>
            <span className="text-sm">
              <span className="font-medium">{choisi.title}</span>
              <span className="block text-xs text-muted-foreground">{choisi.slug}</span>
            </span>
            <button
              type="button"
              onClick={() => choisir(null)}
              className="ml-auto text-xs px-3 py-1 rounded border border-border hover:bg-muted"
            >
              Retirer le logo
            </button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Aucun logo : l&apos;initiale s&apos;affichera.</span>
        )}
      </div>

      <label htmlFor="recherche-logo" className="sr-only">Chercher un logo</label>
      <input
        id="recherche-logo"
        type="search"
        value={libre ? recherche : libelle}
        onChange={(e) => {
          setLibre(true);
          setRecherche(e.target.value);
        }}
        placeholder="Chercher un logo (React, Docker…)"
        autoComplete="off"
        className="w-full px-3 py-2 border border-border rounded-md text-sm mb-2"
      />

      <div role="status" aria-live="polite" className="sr-only">
        {chargement ? "Recherche…" : q ? `${resultats.length} logo${resultats.length > 1 ? "s" : ""} trouvé${resultats.length > 1 ? "s" : ""}` : ""}
      </div>

      {q && !chargement && resultats.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucun logo pour « {q} ». Essayez un autre nom, ou chargez une image ci-dessous.
        </p>
      )}

      {resultats.length > 0 && (
        <ul className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {resultats.map((l) => {
            const actif = choisi?.slug === l.slug;
            return (
              <li key={l.slug}>
                <button
                  type="button"
                  onClick={() => choisir({ slug: l.slug, title: l.title, trace: l.trace })}
                  aria-pressed={actif}
                  title={l.title}
                  className={`w-full flex flex-col items-center gap-1 rounded-md border p-2 text-[11px] leading-tight hover:bg-muted ${
                    actif ? "border-primary ring-2 ring-primary/40" : "border-border"
                  }`}
                >
                  <Trace trace={l.trace} couleur={couleurLisible(l.hex)} />
                  <span className="w-full truncate text-center">{l.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
