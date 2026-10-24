"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ProjectDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { useChangerSurcouche } from "@/components/parcours/parcours-pagine";
import { blocsPresents, credits, lienDemo, lienProjet } from "@/lib/parcours/parchemin";
import { ligneDateProjet } from "@/lib/parcours/journal";

/**
 * Identifiant du titre, cible de `aria-labelledby`. Une constante et non
 * `useId` : un seul parchemin est ouvert a la fois, le nom accessible doit
 * etre stable, et les tests le cherchent par `#parchemin-titre`, ce qu'un
 * jeton de `useId` ne permet pas de garantir : sa forme est interne a React et
 * a change d'une version a l'autre (`:r0:` en 18, un temps `«r0»` en 19,
 * `_r_o_` sous la 19.2.4 mesuree ici), et les deux premieres ne sont pas des
 * identifiants CSS valides.
 */
const ID_TITRE = "parchemin-titre";

/**
 * Le trace des deux bandes. La courbe vit ICI, dans le chemin, et non dans la
 * feuille de style : `.parchemin-bande` ne porte ni `transform` ni
 * `transition`, et le balayage de mouvement du parchemin le verifie regle par
 * regle.
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
  // Remonte par la cle : un autre projet repart d'un etat interne NEUF, effet
  // et drapeau compris, au lieu de recycler celui du precedent.
  //
  // Et ce n'est PAS un remplacement de l'entree d'historique. MESURE, de A vers
  // B : `pushState` est appele DEUX fois et `back` zero fois, donc la seconde
  // entree s'ajoute a la premiere. Apres une fermeture, qui n'en consomme
  // qu'une, il en reste une inerte, et une pression du bouton Retour reste sans
  // effet visible.
  //
  // Le seul appelant ne passe PAS par `null` entre deux projets : il REFUSE la
  // seconde demande, par `setOuvert((courant) => courant ?? p)`, de sorte
  // qu'un parchemin ouvert ne soit jamais remplace par un autre. Le cas est
  // donc ecarte chez lui, et non ici : aucun garde-fou n'est ajoute.
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

  /**
   * Joue les etapes natives de `close` tant que le noeud est ENCORE dans le
   * document. C'est `close` et lui seul qui rend le focus a l'element qui
   * l'avait au moment du `showModal`, donc au declencheur : retirer le
   * `<dialog>` de l'arbre encore ouvert sort bien de la couche superieure,
   * mais la tabulation repartirait du haut de la page.
   *
   * MESURE : jsdom n'implemente pas `close` plus qu'il n'implemente
   * `showModal`. Meme garde qu'a l'ouverture, et pour la meme raison.
   */
  const refermerDialogue = useCallback(() => {
    const d = dialogue.current;
    if (!d || !d.hasAttribute("open")) return;
    if (typeof d.close === "function") d.close();
    // Repli du repli : le dialogue ouvert par l'attribut se referme par
    // l'attribut. Aucun focus a rendre dans ce cas, `showModal` n'ayant pas
    // ete joue non plus.
    else d.removeAttribute("open");
  }, []);

  /**
   * Les quatre voies de FERMETURE passent par `fermer` ou par `surRetour`. Il
   * reste trois voies de DISPARITION qu'elles ne couvrent pas : un changement
   * de `projet` d'un objet a un autre, un `projet` remis a nul par l'appelant
   * hors du chemin de fermeture, et le demontage de la racine. Mesure : dans
   * les trois cas le `<dialog>` quittait l'arbre en portant encore `open`,
   * donc sans rendre le focus au declencheur.
   *
   * MESURE, aux trois formes de demontage : le nettoyage d'un effet de MISE EN
   * PAGE tourne dans la phase de mutation du commit, AVANT que React detache
   * les noeuds hotes, et la ref y est encore pleine (`isConnected` vrai,
   * `document.contains` vrai, `open` encore pose). Ce n'est PAS vrai du
   * nettoyage d'un `useEffect`, ou la ref est nulle : voir le commentaire de
   * l'effet suivant. La distinction est tout l'interet de cette ligne.
   *
   * Un double appel est impossible : `refermerDialogue` sort d'emblee si
   * l'attribut `open` n'est plus la, donc une fermeture deja jouee par
   * `fermer` ou `surRetour` ne compte pas deux fois.
   */
  useLayoutEffect(() => () => refermerDialogue(), [refermerDialogue]);

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

    // Le Retour du navigateur a deja consomme l'entree : on ne rappelle pas
    // `back()`, mais on referme le dialogue par le meme chemin.
    const surRetour = () => {
      refermerDialogue();
      fermetureRef.current();
    };
    window.addEventListener("popstate", surRetour);

    return () => {
      window.removeEventListener("popstate", surRetour);
      // Ne PAS appeler `refermerDialogue` ICI, et ce n'est pas un oubli : le
      // nettoyage d'un `useEffect` est le SEUL des deux qui arrive trop tard.
      // MESURE, aux trois formes de demontage (suppression d'un sous-arbre,
      // demontage de la racine, changement de cle) : React detache le noeud et
      // MET LA REF A NULL avant d'executer ce nettoyage-ci, donc un `close()`
      // pose la sortirait aussitot sur `if (!d) return` : du code mort.
      // Le nettoyage de l'effet de MISE EN PAGE, plus haut, tourne lui AVANT
      // le detachement et fait le travail. `useEffect` non, `useLayoutEffect`
      // oui : ne pas deplacer l'un vers l'autre.
      //
      // Obligatoire, et a cette place et non dans le chemin de fermeture : un
      // parchemin demonte par une autre voie laisserait sinon la pagination
      // MORTE pour le reste de la session, molette, clavier, clic et tactile
      // tous inertes, et la page resterait affichee : panne invisible.
      changerSurcouche(false);
    };
  }, [changerSurcouche, refermerDialogue]);

  /** Le chemin de fermeture unique : bouton, Echap, clic hors de la feuille. */
  const fermer = () => {
    // `close()` d'abord, tant que le noeud est connecte : c'est lui qui rend
    // le focus au declencheur. MESURE : React ne commite le retrait demande
    // par `surFermeture` qu'apres ce gestionnaire, donc l'ordre des trois
    // appels ci-dessous ne deplace pas la connexion du noeud ; ce qui compte
    // est que l'appel soit ICI et non dans le nettoyage de l'effet, ou la ref
    // est deja nulle.
    refermerDialogue();
    // `back()` AVANT `surFermeture`, pour consommer l'entree posee a
    // l'ouverture : sinon elle resterait et un Retour fermerait un parchemin
    // deja ferme.
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
  // `lienDemo` applique au lien de demonstration la regle des liens des
  // credits : `https:` seulement. `blocsPresents` lit la MEME fonction, donc
  // un lien ecarte emporte son bloc : jamais de titre sans lien dessous.
  const demo = lienDemo(projet) ?? "";
  // L'adresse du projet LUI-MEME, distincte de la demonstration : `demoUrl`
  // montre une video ou un bac a sable, `projectUrl` mene au projet en ligne.
  // Meme fonction de filtrage, meme accord avec `blocsPresents`.
  const adresse = lienProjet(projet) ?? "";
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
            {/* Une croix DESSINEE, jamais le caractere de multiplication : il
                rend mal selon les polices et se comporte mal en couleurs
                forcees. Pas de texte visible, donc le nom accessible vient de
                l'`aria-label` seul. */}
            <button
              type="button"
              data-fermer
              aria-label={t("parcours.fermerParchemin")}
              onClick={fermer}
              className="parchemin-fermer"
            >
              <svg
                viewBox="0 0 16 16"
                aria-hidden="true"
                focusable="false"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <path d="M3 3 L13 13" />
                <path d="M13 3 L3 13" />
              </svg>
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

          {/* Blocs 3 a 9, dans l'ordre que donne `blocsPresents`. */}
          {blocsPresents(projet).map((bloc) => {
            switch (bloc) {
              case "photos":
                return (
                  <div key={bloc} className="mt-4 parchemin-photos">
                    {photos.map((src) => (
                      // `alt` vide : le nom du projet est lu juste a cote, une
                      // description redirait la meme chose.
                      <Image
                        key={src}
                        src={src}
                        alt=""
                        width={640}
                        height={360}
                      />
                    ))}
                  </div>
                );
              case "description":
                return (
                  <p key={bloc} className="mt-4 parchemin-prose">
                    {description}
                  </p>
                );
              case "public":
                return (
                  <div key={bloc} className="mt-4 parchemin-prose">
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
                        <li key={c.cle} className="parchemin-credit">
                          {/* Le nom est du texte simple. Le lien vit sur le
                              logo, a sa droite, et c'est l'aria-label qui
                              redit le nom de la personne (WCAG 2.4.4) : sans
                              lui, un lecteur d'ecran annoncerait « LinkedIn »
                              autant de fois qu'il y a de collaborateurs. */}
                          <span>{c.nom}</span>
                          {/* Sans LinkedIn exploitable, ni lien ni logo : un
                              lien mort ou un logo inerte vaudrait moins que
                              le nom seul. */}
                          {c.lien ? (
                            <a
                              className="parchemin-credit-lien"
                              href={c.lien}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t("projects.collaboratorLinkedin", { nom: c.nom })}
                            >
                              {/* Monochrome, teinte par currentColor : la
                                  palette du site ne porte aucune couleur de
                                  marque. Meme trace que le pied de page. */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              case "adresseProjet":
                return (
                  <p key={bloc} className="mt-4">
                    <a href={adresse} target="_blank" rel="noopener noreferrer">
                      {t("projects.viewProject")}
                    </a>
                  </p>
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
