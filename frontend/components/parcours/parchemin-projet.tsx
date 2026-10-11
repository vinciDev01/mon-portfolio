"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ProjectDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useChangerSurcouche } from "@/components/parcours/parcours-pagine";
import { blocsPresents, credits } from "@/lib/parcours/parchemin";
import { ligneDateProjet } from "@/lib/parcours/journal";

/**
 * Identifiant du titre, cible de `aria-labelledby`. Une constante et non
 * `useId` : un seul parchemin est ouvert a la fois, le nom accessible doit
 * etre stable, et `useId` rend en React 19 un jeton entoure de guillemets
 * typographiques, qui n'est pas un identifiant CSS valide.
 */
const ID_TITRE = "parchemin-titre";

/**
 * Le trace des deux bandes. La courbe vit ICI, dans le chemin, et non dans la
 * feuille de style : `.parchemin-bande` ne porte ni `transform` ni
 * `transition`, et le test de forme de la tache 3 le verifie regle par regle.
 */
const TRACE_BANDE = "M0 0 H100 V9 C78 22 52 -1 26 11 C17 15 8 15 0 11 Z";

/** Retourne le trace du haut : un `transform` d'ATTRIBUT SVG, jamais CSS. */
const RETOURNEMENT = "translate(0 24) scale(1 -1)";

function Bande({ bas = false }: { bas?: boolean }) {
  return (
    <svg
      className="parchemin-bande"
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRACE_BANDE} transform={bas ? RETOURNEMENT : undefined} />
    </svg>
  );
}

/**
 * Le dossier d'un projet, en surcouche de la section des projets.
 *
 * `projet` nul ne rend rien : c'est l'etat ferme, et le composant disparait
 * alors de l'arbre, ce qui declenche le nettoyage de son effet.
 */
export function ParcheminProjet({
  projet,
  surFermeture,
}: {
  projet: ProjectDto | null;
  surFermeture: () => void;
}) {
  if (!projet) return null;
  // Remonte par la cle : un autre projet remplace entierement l'etat interne
  // (l'entree d'historique, le drapeau) au lieu de le recycler.
  return <Dossier key={projet.id} projet={projet} surFermeture={surFermeture} />;
}

function Dossier({
  projet,
  surFermeture,
}: {
  projet: ProjectDto;
  surFermeture: () => void;
}) {
  const { t, locale } = useTranslation();
  const changerSurcouche = useChangerSurcouche();
  const dialogue = useRef<HTMLDialogElement>(null);

  // L'ecouteur `popstate` est pose une seule fois ; il lit la derniere version
  // de `surFermeture` par une ref, sans quoi il garderait celle du montage.
  const fermetureRef = useRef(surFermeture);
  useEffect(() => {
    fermetureRef.current = surFermeture;
  });

  useEffect(() => {
    const d = dialogue.current;
    if (!d) return;

    // `showModal` donne a elle seule les quatre comportements modaux : capture
    // du focus, inertie du reste de la page, voile natif, et fermeture par
    // Echap geree par le navigateur. jsdom ne l'implemente pas : le repli pose
    // l'attribut `open`, ce qui rend bien la feuille et la laisse observable,
    // mais sans aucun de ces quatre comportements.
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");

    // Le drapeau suspend la pagination tant que le parchemin est a l'ecran.
    changerSurcouche(true);

    // L'entree n'existe que pour donner prise au bouton Retour : elle ne
    // decrit aucun etat, donc elle reprend l'URL COURANTE, fragment compris.
    // Un fragment etranger changerait de section a la fermeture, le conteneur
    // traitant le `popstate` une fois le drapeau retombe.
    try {
      history.pushState(null, "", location.href);
    } catch {
      // Safari plafonne les ecritures d'historique et leve au-dela : le
      // parchemin doit s'ouvrir quand meme, seul le bouton Retour y perd.
    }

    const surRetour = () => fermetureRef.current();
    window.addEventListener("popstate", surRetour);

    return () => {
      window.removeEventListener("popstate", surRetour);
      // Obligatoire, et a cette place et non dans le chemin de fermeture : un
      // parchemin demonte par une autre voie laisserait sinon la pagination
      // MORTE pour le reste de la session, molette, clavier, clic et tactile
      // tous inertes, et la page resterait affichee : panne invisible.
      changerSurcouche(false);
    };
  }, [changerSurcouche]);

  /** Le chemin de fermeture unique : bouton, Echap, clic hors de la feuille. */
  const fermer = () => {
    // `back()` d'ABORD, pour consommer l'entree posee a l'ouverture : sinon
    // elle resterait et un Retour fermerait un parchemin deja ferme.
    history.back();
    surFermeture();
  };

  const date = ligneDateProjet(projet, locale, t);
  const personnes = credits(projet);
  // Les deux champs sont lus sans condition : c'est `blocsPresents` qui decide
  // si le bloc parait, et un second filtre ici ferait divergent titre et
  // contenu.
  const description = projet.description ?? "";
  const publicVise = projet.targetAudience ?? "";
  const demo = projet.demoUrl?.trim() ?? "";
  // Les chemins blancs sont ecartes comme le fait `renseigne` en amont : le
  // bloc « photos » parait des qu'UNE des deux est renseignee, la seconde ne
  // doit pas laisser une image rompue.
  const photos = [projet.photo1Path, projet.photo2Path]
    .map((p) => (p && p.trim() !== "" ? getFileUrl(p.trim()) : null))
    .filter((u): u is string => u !== null);
  // La mention « En cours » accompagne la ligne de date quand le terme manque.
  // Elle ne conditionne pas le bloc : c'est `ligneDateProjet` qui s'en charge,
  // en rendant `null` sans aucune date.
  const enCours = Boolean(projet.startDate) && !projet.endDate;

  return (
    <dialog
      ref={dialogue}
      className="parchemin"
      aria-labelledby={ID_TITRE}
      onCancel={(e) => {
        // Echap : on garde la main pour passer par `fermer`, sinon le dialogue
        // se refermerait seul et laisserait l'entree d'historique derriere lui.
        e.preventDefault();
        fermer();
      }}
      onClick={(e) => {
        // Le clic hors de la feuille atteint le dialogue lui-meme.
        if (e.target === dialogue.current) fermer();
      }}
    >
      {/* Enfant DIRECT du dialogue, et exactement trois enfants dans cet
          ordre : la grille `auto 1fr auto` de la feuille en depend, et c'est
          ce `1fr` qui borne le corps et le fait defiler seul. */}
      <div className="parchemin-feuille">
        <Bande />
        <div className="parchemin-corps" data-defilement-propre>
          <div className="flex items-start justify-between gap-4">
            {/* Bloc 1 : le nom, toujours rendu, porteur du nom accessible. */}
            <h2 id={ID_TITRE} className="text-xl font-semibold">
              {projet.name}
            </h2>
            <button
              type="button"
              data-fermer
              aria-label={t("parcours.fermerParchemin")}
              onClick={fermer}
              className="border border-[var(--bordure-signifiante)] px-3 py-1 text-sm"
            >
              {t("parcours.fermerParchemin")}
            </button>
          </div>

          {/* Bloc 2 : les dates propres, en UTC et jamais depuis l'horloge
              locale. `ligneDateProjet` rend `null` sans date, donc elle se
              cache d'elle-meme : aucune condition ajoutee par-dessus. */}
          {date && (
            <p className="meta">
              {enCours ? `${date} · ${t("projects.ongoing")}` : date}
            </p>
          )}

          {/* Blocs 3 a 8, dans l'ordre que donne `blocsPresents`. */}
          {blocsPresents(projet).map((bloc) => {
            switch (bloc) {
              case "photos":
                return (
                  <div key={bloc} className="mt-4 grid gap-3">
                    {photos.map((src) => (
                      // `alt` vide : le nom du projet est lu juste a cote, une
                      // description redirait la meme chose.
                      <Image
                        key={src}
                        src={src}
                        alt=""
                        width={640}
                        height={360}
                        className="h-auto w-full"
                      />
                    ))}
                  </div>
                );
              case "description":
                return (
                  <p key={bloc} className="mt-4">
                    {description}
                  </p>
                );
              case "public":
                return (
                  <div key={bloc} className="mt-4">
                    <h3 className="font-semibold">{t("projects.targetAudience")}</h3>
                    <p>{publicVise}</p>
                  </div>
                );
              case "technologies":
                return (
                  <div key={bloc} className="mt-4">
                    <h3 className="font-semibold">{t("projects.technologies")}</h3>
                    {/* Point median, comme la signature du journal : des
                        etiquettes colorees ajouteraient une couleur de sens. */}
                    <p>{projet.technologies.map((x) => x.label).join(" · ")}</p>
                  </div>
                );
              case "collaborateurs":
                return (
                  <div key={bloc} className="mt-4">
                    <h3 className="font-semibold">{t("projects.collaborators")}</h3>
                    {/* Les credits vivent DANS le corps, ce n'est pas une
                        rangee de la grille de la feuille. */}
                    <ul className="parchemin-credits">
                      {personnes.map((c) => (
                        <li key={c.cle}>
                          {/* Sans LinkedIn exploitable, le nom SANS lien : un
                              lien mort vaudrait moins que du texte. */}
                          {c.lien ? (
                            <a href={c.lien} target="_blank" rel="noopener noreferrer">
                              {c.nom}
                            </a>
                          ) : (
                            c.nom
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              case "demonstration":
                return (
                  <p key={bloc} className="mt-4">
                    <a href={demo} target="_blank" rel="noopener noreferrer">
                      {t("projects.viewDemo")}
                    </a>
                  </p>
                );
            }
          })}
        </div>
        <Bande bas />
      </div>
    </dialog>
  );
}
