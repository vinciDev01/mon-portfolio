"use client";

import { useId, useState, type ReactNode } from "react";
import { toast } from "sonner";

/** Le fichier respecte-t-il `accept` ? Memes formes que l'attribut HTML :
 *  type exact (`application/pdf`), famille (`image/*`) ou extension (`.pdf`).
 *  Un type inconnu du navigateur (chaine vide) passe : l'API tranchera. */
export function fichierAccepte(fichier: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const nom = fichier.name.toLowerCase();
  return accept.split(",").some((brut) => {
    const regle = brut.trim().toLowerCase();
    if (!regle) return false;
    if (regle.startsWith(".")) return nom.endsWith(regle);
    if (!fichier.type) return true;
    if (regle.endsWith("/*")) return fichier.type.startsWith(regle.slice(0, -1));
    return fichier.type === regle;
  });
}

function IconeFichier({ actif }: { actif: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-10 shrink-0 ${actif ? "text-primary" : "text-muted-foreground"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

/**
 * La zone de depot commune a tous les champs de fichier du backoffice : un
 * cadre en pointilles ou l'on clique ou glisse un fichier.
 *
 * La zone entiere est l'etiquette du champ : un clic l'ouvre, et le champ,
 * masque a l'oeil mais pas au clavier, prend le focus avec Tab ; la zone se
 * marque alors. Un fichier refuse par `accept` ne part pas. Rechoisir le meme
 * fichier relance l'envoi.
 *
 * Le composant ne connait pas l'envoi : il rend le fichier choisi a
 * `onFichier`, et le parent dit par `envoi` quand il travaille.
 */
export function ZoneDepot({
  label,
  id,
  accept,
  envoi = false,
  onFichier,
  titre,
  detail,
  apercu,
  rempli = false,
  refus = "Ce type de fichier n'est pas accepté",
}: {
  label: string;
  id?: string;
  accept?: string;
  envoi?: boolean;
  onFichier: (fichier: File) => void;
  /** Ligne principale ; par defaut, l'invitation a deposer. */
  titre?: ReactNode;
  /** Ligne secondaire : contraintes, taille, nom du fichier en place. */
  detail?: ReactNode;
  /** Remplace l'icone de fichier, par exemple l'apercu d'une image. */
  apercu?: ReactNode;
  /** Un fichier est en place : l'icone prend la couleur primaire. */
  rempli?: boolean;
  refus?: string;
}) {
  const idAuto = useId();
  const idChamp = id ?? idAuto;
  const [survol, setSurvol] = useState(false);

  function recevoir(fichier: File | undefined) {
    if (!fichier || envoi) return;
    if (!fichierAccepte(fichier, accept)) {
      toast.error(refus);
      return;
    }
    onFichier(fichier);
  }

  return (
    <div>
      <span className="block text-sm font-medium mb-1">{label}</span>
      <label
        htmlFor={idChamp}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          recevoir(e.dataTransfer.files?.[0]);
        }}
        className={`flex items-center gap-4 rounded-lg border-2 border-dashed p-4 min-h-[96px] transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${
          envoi ? "cursor-progress opacity-70" : "cursor-pointer"
        } ${survol ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
      >
        {apercu ?? <IconeFichier actif={rempli} />}
        <span className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium [overflow-wrap:anywhere]">
            {envoi ? "Envoi en cours…" : (titre ?? "Glissez un fichier ici ou cliquez pour choisir")}
          </span>
          {!envoi && detail && <span className="text-xs text-muted-foreground">{detail}</span>}
        </span>
        <input
          id={idChamp}
          type="file"
          accept={accept}
          disabled={envoi}
          onChange={(e) => {
            recevoir(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="sr-only"
        />
      </label>
    </div>
  );
}
