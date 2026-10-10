"use client";

import Image from "next/image";
import type { ProjectDto } from "@portfolio/shared-types";
import { getFileUrl } from "@/lib/api";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { dispositionJournal, ligneDate } from "@/lib/parcours/ligne-date";

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
function Article({ projet, tete }: { projet: ProjectDto; tete: boolean }) {
  // Nul quand le projet de tete n'a pas de `photo1Path` : aucune place vide.
  const image = tete ? getFileUrl(projet.photo1Path) : null;
  return (
    <article className={tete ? "journal-tete journal-article" : "journal-article"}>
      {image && (
        <Image
          src={image}
          alt=""
          width={576}
          height={288}
          className="journal-image"
        />
      )}
      <h3 className="journal-titre">{projet.name}</h3>
      {projet.description && <p className="journal-corps">{projet.description}</p>}
      {projet.technologies.length > 0 && (
        <p className="journal-signature">
          {projet.technologies.map((x) => x.label).join(" · ")}
        </p>
      )}
    </article>
  );
}

export function JournalProjets({ projets }: { projets: ProjectDto[] }) {
  const { t, locale } = useTranslation();
  const d = dispositionJournal(projets);
  if (!d) return null;

  const { tete, suite } = d;
  const date = ligneDate(projets, locale, t);

  return (
    <div className="journal">
      <header className="journal-bandeau">
        {date && <p className="meta">{date}</p>}
      </header>

      <Article projet={tete} tete />

      {suite.length === 0 ? null : suite.length === 1 ? (
        <Article projet={suite[0]} tete={false} />
      ) : (
        <div className="journal-colonnes">
          {suite.map((p) => (
            <Article key={p.id} projet={p} tete={false} />
          ))}
        </div>
      )}
    </div>
  );
}
