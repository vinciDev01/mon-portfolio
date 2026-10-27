"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useChangerSurcouche } from "@/components/parcours/parcours-pagine";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { BordImparfait } from "@/components/portfolio/bord-imparfait";

/**
 * L'image entiere d'une certification, dans une fenetre par-dessus la page :
 * on la regarde sans quitter le portfolio. Montee a l'ouverture, demontee a
 * la fermeture.
 *
 * Meme mecanique que le parchemin, en plus court : `showModal` donne la
 * capture du focus, l'inertie du reste de la page et le voile ; la fermeture
 * passe par le bouton, Echap ou un clic hors de l'image ; le drapeau de
 * surcouche suspend la pagination tant qu'elle est ouverte. Le bouton Retour
 * du navigateur n'est pas branche ici : une image ne merite pas d'entree
 * d'historique.
 */
export function VisionneuseImage({
  src,
  alt,
  legende,
  surFermeture,
}: {
  src: string;
  alt: string;
  legende: string;
  surFermeture: () => void;
}) {
  const { t } = useTranslation();
  const changerSurcouche = useChangerSurcouche();
  const dialogue = useRef<HTMLDialogElement>(null);

  // `close()` tant que le noeud est connecte : c'est lui qui rend le focus a
  // la vignette. jsdom n'a ni `showModal` ni `close` : repli par l'attribut.
  const refermer = () => {
    const d = dialogue.current;
    if (!d || !d.hasAttribute("open")) return;
    if (typeof d.close === "function") d.close();
    else d.removeAttribute("open");
  };

  // Nettoyage de MISE EN PAGE : il tourne avant le detachement du noeud, la
  // ou celui d'un `useEffect` trouverait la ref deja nulle (voir le parchemin).
  useLayoutEffect(() => () => refermer(), []);

  useEffect(() => {
    const d = dialogue.current;
    if (!d) return;
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    changerSurcouche(true);
    // Obligatoire ici et non dans `fermer` : une fenetre demontee par une
    // autre voie laisserait sinon la pagination morte.
    return () => changerSurcouche(false);
  }, [changerSurcouche]);

  const fermer = () => {
    refermer();
    surFermeture();
  };

  return (
    <dialog
      ref={dialogue}
      className="visionneuse"
      aria-label={legende}
      onCancel={(e) => {
        // Echap : on passe par `fermer` pour que la page demonte la fenetre.
        e.preventDefault();
        fermer();
      }}
      onClick={(e) => {
        // Le clic hors de la feuille atteint le dialogue lui-meme.
        if (e.target === dialogue.current) fermer();
      }}
    >
      <figure className="visionneuse-feuille cadre-imparfait">
        <BordImparfait graine={src} amplitude={2} pas={48} />
        <div className="visionneuse-entete">
          <figcaption>{legende}</figcaption>
          <button
            type="button"
            aria-label={t("certifications.fermerImage")}
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
        {/* next/image demande des dimensions connues : l'image entiere n'en a
            pas, elle garde ses proportions dans les bornes de la feuille. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="visionneuse-image" />
      </figure>
    </dialog>
  );
}
