"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n/i18n-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Les quatre etats du formulaire, dans leur ordre d'apparition. */
type Etat = "repos" | "envoi" | "succes" | "echec";

/** Les cinq champs, vides. C'est aussi la forme du corps envoye au serveur. */
const VIDE = {
  firstName: "",
  lastName: "",
  email: "",
  subject: "",
  message: "",
} as const;

type Champs = Record<keyof typeof VIDE, string>;

/**
 * Un champ et son etiquette liee. L'etiquette porte la marque d'obligation,
 * qui est un CARACTERE et non une couleur : l'information survit a la perte de
 * la teinte (critere 1.4.1), et l'attribut `required` la dit aux lecteurs
 * d'ecran. Les deux signaux coexistent, aucun ne porte seul.
 */
function Champ({
  nom,
  cleLibelle,
  children,
}: {
  nom: keyof typeof VIDE;
  cleLibelle: string;
  children: (id: string) => ReactNode;
}) {
  const { t } = useTranslation();
  const id = `contact-${nom}`;
  return (
    <div className="formulaire-champ">
      <label className="formulaire-etiquette" htmlFor={id}>
        {t(cleLibelle)} <span className="formulaire-requis">*</span>
      </label>
      {children(id)}
    </div>
  );
}

/**
 * Le formulaire de contact, son etat et ses annonces.
 *
 * Trois decisions portent ce composant, et chacune corrige un defaut mesure
 * sur l'ancienne section :
 *
 * 1. Le formulaire SURVIT a l'envoi. L'ancien se faisait remplacer par son
 *    message de succes, donc le focus se retrouvait sur un bouton disparu et
 *    la tabulation repartait du haut de la page.
 * 2. Le message d'etat parait AU-DESSUS du formulaire conserve, dans une
 *    region `aria-live="polite"` qui recoit le focus. La region est montee en
 *    permanence, meme vide : une region inseree en meme temps que son contenu
 *    n'est pas annoncee de facon fiable.
 * 3. L'etat se dit par trois choses a la fois : une bordure signifiante, un
 *    glyphe DESSINE et un texte explicite. Aucune couleur neuve, et le glyphe
 *    est muet (`aria-hidden`) : le sens vit dans le texte.
 */
export function FormulaireContact() {
  const { t } = useTranslation();
  const [champs, setChamps] = useState<Champs>({ ...VIDE });
  const [etat, setEtat] = useState<Etat>("repos");
  const regionEtat = useRef<HTMLDivElement | null>(null);
  /* Le drapeau d'envoi garde la FONCTION, non le bouton. Le `disabled` du
     bouton est une protection d'interface : la touche Entree dans un champ
     soumet le formulaire sans jamais passer par lui. Un `ref` et non un etat,
     parce qu'il doit etre lu et pose dans le meme tour de boucle. */
  const envoiEnCours = useRef(false);

  const surSaisie = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setChamps((avant) => ({ ...avant, [name]: value }));
    },
    [],
  );

  /* Le focus suit l'annonce, mais seulement quand l'envoi est termine : il
     n'y a rien a annoncer avant, et porter le focus sur une region vide ne
     dirait rien au visiteur. Pendant l'envoi le focus reste donc la ou il
     est, et il y reste VRAIMENT : le bouton porte `aria-disabled` et non
     `disabled`, parce qu'un bouton qui devient `disabled` sous le doigt perd
     le focus au profit du `body`. */
  useEffect(() => {
    if (etat === "succes" || etat === "echec") regionEtat.current?.focus();
  }, [etat]);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (envoiEnCours.current) return;
    envoiEnCours.current = true;
    setEtat("envoi");
    try {
      const reponse = await fetch(`${API_URL}/api/contact-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(champs),
      });
      /* Deux chemins d'echec distincts : le code HTTP se lit ici, le rejet
         reseau tombe dans le `catch`. Les deux doivent donner le MEME etat
         d'erreur, sinon une coupure laisse le formulaire muet. */
      if (!reponse.ok) {
        setEtat("echec");
      } else {
        setEtat("succes");
        setChamps({ ...VIDE });
      }
    } catch {
      setEtat("echec");
    } finally {
      envoiEnCours.current = false;
    }
  };

  const succes = etat === "succes";
  const envoi = etat === "envoi";

  return (
    <>
      <div
        className="formulaire-etat"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
        ref={regionEtat}
      >
        {(etat === "succes" || etat === "echec") && (
          <div className="formulaire-etat-bloc">
            <svg
              className="formulaire-etat-glyphe"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              {succes ? (
                <path d="M4 13l5 5L20 6" />
              ) : (
                <>
                  <path d="M12 4v10" />
                  <path d="M12 19h0.01" />
                </>
              )}
            </svg>
            <div className="formulaire-etat-texte">
              <p className="formulaire-etat-titre">
                {succes ? t("contact.success") : t("contact.error")}
              </p>
              {/* A l'echec, le recours : le volet des coordonnees est a cote. */}
              <p className="formulaire-etat-detail">
                {succes ? t("contact.successDetail") : t("contact.errorFallback")}
              </p>
            </div>
          </div>
        )}
      </div>

      <form className="formulaire-contact" onSubmit={envoyer}>
        {/* L'asterisque des cinq etiquettes s'explique ICI, une fois. Repetee
            dans chaque etiquette, la phrase alourdirait les cinq noms
            accessibles sans rien apprendre de plus. */}
        <p className="formulaire-legende">{t("contact.requiredLegend")}</p>

        {/* Prenom et nom sur une seule ligne des que la place le permet, sans
            requete de media : la rangee se replie d'elle-meme. */}
        <div className="formulaire-rangee">
          <Champ nom="firstName" cleLibelle="contact.firstName">
            {(id) => (
              <input
                className="formulaire-saisie"
                id={id}
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={champs.firstName}
                onChange={surSaisie}
              />
            )}
          </Champ>
          <Champ nom="lastName" cleLibelle="contact.lastName">
            {(id) => (
              <input
                className="formulaire-saisie"
                id={id}
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={champs.lastName}
                onChange={surSaisie}
              />
            )}
          </Champ>
        </div>

        {/* Courriel et sujet cote a cote, comme prenom et nom : une rangee
            de moins, et la section tient sur un ecran avec son pied. */}
        <div className="formulaire-rangee">
        <Champ nom="email" cleLibelle="contact.email">
          {(id) => (
            <input
              className="formulaire-saisie"
              id={id}
              name="email"
              type="email"
              autoComplete="email"
              required
              value={champs.email}
              onChange={surSaisie}
            />
          )}
        </Champ>

        <Champ nom="subject" cleLibelle="contact.subject">
          {(id) => (
            <input
              className="formulaire-saisie"
              id={id}
              name="subject"
              type="text"
              required
              value={champs.subject}
              onChange={surSaisie}
            />
          )}
        </Champ>
        </div>

        <Champ nom="message" cleLibelle="contact.message">
          {(id) => (
            <textarea
              className="formulaire-saisie formulaire-zone"
              id={id}
              name="message"
              rows={3}
              required
              value={champs.message}
              onChange={surSaisie}
            />
          )}
        </Champ>

        {/* Le bouton reste identifiable pendant l'envoi : il change de mot,
            jamais de nature. Pas de roue muette.

            `aria-disabled` et non `disabled` : un bouton desactive n'est plus
            focalisable, donc le navigateur rend le focus au `body` et la
            tabulation repart du haut de la page. Le bouton reste donc
            cliquable, et c'est le drapeau `envoiEnCours` qui refuse le second
            envoi, comme il refuse deja celui de la touche Entree. */}
        <button
          className="formulaire-envoyer"
          type="submit"
          aria-disabled={envoi}
          aria-busy={envoi}
        >
          {envoi ? t("contact.sending") : t("contact.send")}
        </button>
      </form>
    </>
  );
}
