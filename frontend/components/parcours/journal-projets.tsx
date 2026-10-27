"use client";

import { Fragment, useId, useRef, useState } from "react";
import Image from "next/image";
import type { ProjectDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { ParcheminProjet } from "@/components/parcours/parchemin-projet";
import { BordImparfait } from "@/components/portfolio/bord-imparfait";
import { useTranslation } from "@/lib/i18n/i18n-context";
import {
  dispositionJournal,
  ligneCollaborateurs,
  ligneDate,
  ligneDateProjet,
  pageDeSuite,
} from "@/lib/parcours/journal";
import { lienDemo } from "@/lib/parcours/parchemin";

/**
 * Les projets en une de presse : un bandeau date, un projet de tete avec son
 * image, puis les suivants en colonnes separees de filets fins.
 *
 * Le seuil de mise en colonnes porte sur la MESURE et non sur la largeur de
 * fenetre : la mesure varie dans un meme palier selon ce que l'ampoule laisse,
 * et un seuil en fenetre produirait des colonnes de 24 caracteres.
 *
 * Le titre de section est deja rendu par SectionShell : le bandeau ne porte
 * que la ligne de date.
 */
export function Article({
  projet,
  tete,
  surOuverture,
}: {
  projet: ProjectDto;
  tete: boolean;
  // REQUIS : un `Article` sans gestionnaire porterait un bouton qui ne fait rien.
  surOuverture: (p: ProjectDto) => void;
}) {
  const { t, locale } = useTranslation();
  // Relie chaque bouton « Details » au titre de SON article.
  const idTitre = useId();
  // Meme regle que le parchemin (`https:` seul) : le meme champ ne doit pas
  // donner un lien vivant ici et un bloc masque la.
  const demo = lienDemo(projet);
  // Un nom blanc vaut un nom absent : sans repli, les deux boutons seraient
  // anonymes.
  const nom = projet.name.trim() || t("projects.sansTitre");
  const dateProjet = ligneDateProjet(projet, locale, t);
  const avec = ligneCollaborateurs(projet, locale, t);
  // Nul quand le projet de tete n'a pas de `photo1Path` : aucune place vide.
  const image = tete ? getFileUrl(projet.photo1Path) : null;
  return (
    <article className={tete ? "journal-tete journal-article" : "journal-article"}>
      {image && (
        // Meme action que le titre. Pas d'`aria-hidden` : un bouton focalisable
        // cache aux lecteurs d'ecran est un defaut, et `alt=""` laisserait ce
        // bouton sans nom. Son etiquette dit qu'il s'agit de la photo, pour ne pas
        // doublonner celle du titre (liste de boutons, commande vocale).
        <button
          type="button"
          className="journal-declencheur journal-declencheur-image"
          aria-label={t("projects.photoDe", { nom })}
          title={t("projects.clickForDetails")}
          onClick={() => surOuverture(projet)}
        >
          <Image
            src={image}
            alt=""
            width={576}
            height={288}
            className="journal-image"
          />
        </button>
      )}
      {/* Un bouton DANS le titre : le titre garde sa semantique, et le lien de
          demonstration reste frere du bouton, jamais son enfant. */}
      <h3 id={idTitre} className="journal-titre">
        <button
          type="button"
          className="journal-declencheur"
          title={t("projects.clickForDetails")}
          onClick={() => surOuverture(projet)}
        >
          {nom}
        </button>
      </h3>
      {dateProjet && <p className="meta journal-date">{dateProjet}</p>}
      {avec && <p className="journal-collaborateurs">{avec}</p>}
      {projet.description && <p className="journal-corps">{projet.description}</p>}
      {/* Troisieme declencheur, meme gestionnaire que le titre et la photo. */}
      <p>
        <button
          type="button"
          className="journal-details"
          aria-describedby={idTitre}
          onClick={() => surOuverture(projet)}
        >
          {t("projects.details")}
        </button>
      </p>
      {demo && (
        <p>
          <a
            href={demo}
            target="_blank"
            rel="noopener noreferrer"
            className="journal-lien"
          >
            {t("projects.viewDemo")}
          </a>
        </p>
      )}
      {projet.technologies.length > 0 && (
        <p className="journal-signature">
          {projet.technologies.map((x) => x.label).join(" · ")}
        </p>
      )}
    </article>
  );
}

/**
 * La pagination de la suite : precedente, les numeros, suivante. Des
 * etiquettes au bord use ; la page courante porte `aria-current`.
 */
function Pagination({
  page,
  pages,
  aller,
}: {
  page: number;
  pages: number;
  aller: (p: number) => void;
}) {
  const { t } = useTranslation();
  const bouton = (cible: number, contenu: string, etiquette: string, desactive = false, courant = false) => (
    <button
      type="button"
      className="pagination-bouton cadre-imparfait"
      onClick={() => aller(cible)}
      disabled={desactive}
      aria-label={etiquette}
      aria-current={courant ? "page" : undefined}
    >
      <BordImparfait graine={`page-${contenu}`} etire />
      {contenu}
    </button>
  );
  return (
    <nav className="journal-pagination" aria-label={t("projects.pagination")}>
      {bouton(page - 1, "‹", t("projects.precedente"), page === 1)}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Fragment key={n}>{bouton(n, String(n), t("projects.allerPage", { n: String(n) }), false, n === page)}</Fragment>
      ))}
      {bouton(page + 1, "›", t("projects.suivante"), page === pages)}
    </nav>
  );
}

export function JournalProjets({ projets }: { projets: ProjectDto[] }) {
  const { t, locale } = useTranslation();
  // Un seul etat, un seul parchemin monte. Voir `ouvrir` pour le passage par
  // `null`.
  const [ouvert, setOuvert] = useState<ProjectDto | null>(null);
  // La page de la suite : le projet de tete reste toujours affiche au-dessus.
  const [pageVoulue, setPageVoulue] = useState(1);
  const haut = useRef<HTMLDivElement>(null);
  const d = dispositionJournal(projets);
  if (!d) return null;

  // On ne passe JAMAIS d'un projet a un autre : le parchemin empile une entree
  // d'historique a l'ouverture et ne la consomme qu'a sa fermeture. Tant qu'un
  // projet est ouvert, une nouvelle demande est ignoree (en production le
  // reste de la page est inerte, ce chemin n'existe que sous le repli).
  const ouvrir = (p: ProjectDto) => setOuvert((courant) => courant ?? p);

  const { tete } = d;
  const { elements: suite, page, pages } = pageDeSuite(d.suite, pageVoulue);
  const date = ligneDate(projets, locale, t);

  // Changer de page ramene au debut de la suite : sans cela, on resterait
  // devant la pagination, en bas d'une page qu'on ne voit pas changer.
  const aller = (p: number) => {
    setPageVoulue(p);
    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    haut.current?.scrollIntoView?.({ block: "start", behavior: reduit ? "auto" : "smooth" });
  };

  return (
    <div className="journal">
      <header className="journal-bandeau">
        {date && <p className="meta">{date}</p>}
      </header>

      <Article projet={tete} tete surOuverture={ouvrir} />

      <div ref={haut} className="journal-ancre" />
      {suite.length === 0 ? null : suite.length === 1 ? (
        <Article projet={suite[0]} tete={false} surOuverture={ouvrir} />
      ) : (
        <div className="journal-colonnes">
          {suite.map((p) => (
            <Article key={p.id} projet={p} tete={false} surOuverture={ouvrir} />
          ))}
        </div>
      )}
      {pages > 1 && (
        <>
          <Pagination page={page} pages={pages} aller={aller} />
          <p className="sr-only" role="status" aria-live="polite">
            {t("projects.page", { n: String(page), total: String(pages) })}
          </p>
        </>
      )}

      {/* Monte UNE fois, hors de toute boucle : son identifiant de titre est
          une constante de module. */}
      <ParcheminProjet projet={ouvert} surFermeture={() => setOuvert(null)} />
    </div>
  );
}
