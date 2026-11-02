"use client";

import type { CvSectionDto } from "@portfolio/shared-types";

/**
 * Formulaire partage par la creation et l'edition d'une section de CV. Sa
 * place dans le document se regle par les fleches de la page « Sections du
 * CV », pas ici.
 */

/** Les sections produites depuis la base, avec leur rang d'origine et la
 *  page du backoffice qui edite leurs donnees : c'est la qu'on les modifie,
 *  pas ici. */
export const RANGS_DE_LA_BASE = [
  { cle: "presentation", rang: 10, titre: "PRÉSENTATION", page: "/presentations" },
  { cle: "experiences", rang: 20, titre: "EXPÉRIENCES PROFESSIONNELLES", page: "/experiences" },
  { cle: "competences", rang: 25, titre: "COMPÉTENCES", page: "/skills" },
  { cle: "technologies", rang: 30, titre: "TECHNOLOGIES", page: "/technologies" },
  { cle: "projets", rang: 40, titre: "PROJETS RÉALISÉS", page: "/projects" },
  { cle: "certifications", rang: 50, titre: "CERTIFICATIONS", page: "/certifications" },
  { cle: "cours", rang: 55, titre: "COURS RÉDIGÉS", page: "/cours" },
] as const;

export type ValeursSection = {
  titre: string;
  /** Versions anglaises, pour le CV en anglais ; vides, le francais. */
  titreEn: string;
  lignes: string;
  lignesEn: string;
  publique: boolean;
  /** Absent a la creation : la section se place en fin de CV. */
  sortOrder?: number;
  format: FormatSection;
};

export type FormatSection = CvSectionDto["format"];

/** Les trois presentations du corps, avec ce qu'elles donnent. */
const FORMATS: { valeur: FormatSection; libelle: string; exemple: string }[] = [
  { valeur: "puces", libelle: "Puces", exemple: "• Français (natif)\n• Anglais (courant)" },
  { valeur: "virgules", libelle: "Virgules", exemple: "Français (natif), Anglais (courant)" },
  { valeur: "lignes", libelle: "À la ligne", exemple: "Français (natif)\nAnglais (courant)" },
];

export function CvSectionForm({
  valeurs,
  onChange,
}: {
  valeurs: ValeursSection;
  onChange: (v: ValeursSection) => void;
}) {
  const maj = (partiel: Partial<ValeursSection>) =>
    onChange({ ...valeurs, ...partiel });

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          type="text"
          value={valeurs.titre}
          onChange={(e) => maj({ titre: e.target.value })}
          required
          maxLength={80}
          placeholder="Formations"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Il sera mis en capitales dans le PDF. Les accents sont conservés.
        </p>
      </div>

      <div>
        <label htmlFor="section-titre-en" className="block text-sm font-medium mb-1">Titre (anglais)</label>
        <input
          id="section-titre-en"
          type="text"
          value={valeurs.titreEn}
          onChange={(e) => maj({ titreEn: e.target.value })}
          maxLength={80}
          placeholder="Education"
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">Pour le CV en anglais. Vide : le texte français est repris.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contenu</label>
        <textarea
          value={valeurs.lignes}
          onChange={(e) => maj({ lignes: e.target.value })}
          required
          rows={7}
          placeholder={"2022-2025 : Licence professionnelle à IPNET\n2019-2022 : Baccalauréat série D"}
          className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Une entrée par ligne. Les lignes vides sont ignorées, et une section
          sans aucune entrée n&apos;apparaît pas dans le PDF.
        </p>
      </div>

      <div>
        <label htmlFor="section-lignes-en" className="block text-sm font-medium mb-1">Contenu (anglais)</label>
        <textarea
          id="section-lignes-en"
          value={valeurs.lignesEn}
          onChange={(e) => maj({ lignesEn: e.target.value })}
          rows={5}
          className="w-full px-3 py-2 border border-border rounded-md text-sm font-mono"
        />
        <p className="text-xs text-muted-foreground mt-1">Pour le CV en anglais. Vide : le texte français est repris.</p>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium mb-2">Présentation dans le CV</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {FORMATS.map((f) => (
            <label
              key={f.valeur}
              className={`flex flex-col gap-2 rounded-md border p-3 text-sm cursor-pointer ${
                valeurs.format === f.valeur ? "border-primary ring-1 ring-primary" : "border-border"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="format-section"
                  value={f.valeur}
                  checked={valeurs.format === f.valeur}
                  onChange={() => maj({ format: f.valeur })}
                />
                {f.libelle}
              </span>
              <span className="whitespace-pre-line text-xs text-muted-foreground">{f.exemple}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Sa place dans le CV se règle avec les flèches de la page « Sections du CV ».
        </p>
      </fieldset>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={valeurs.publique}
          onChange={(e) => maj({ publique: e.target.checked })}
          className="mt-1"
        />
        <span>
          Inclure dans le CV téléchargeable
          <span className="block text-xs text-muted-foreground mt-1">
            Décochez pour tout ce qui ne doit pas être publié : adresse
            personnelle, coordonnées de référents. La section reste enregistrée
            et réactivable, mais n&apos;apparaît pas dans le PDF public.
          </span>
        </span>
      </label>
    </>
  );
}
