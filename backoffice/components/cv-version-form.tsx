"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchEntities } from "@/lib/api";
import { RANGS_DE_LA_BASE } from "@/components/cv-section-form";
import type { CvVersionDto, PresentationDto, ProjectDto, SkillDto, TechnologyDto } from "@portfolio/shared-types";

export type ValeursVersion = {
  nom: string;
  langue: "fr" | "en";
  titrePoste: string;
  presentation: string;
  sectionsMasquees: string[];
  projetIds: string[];
  technologieIds: string[];
  competenceIds: string[];
};

export const VERSION_VIDE: ValeursVersion = {
  nom: "",
  langue: "fr",
  titrePoste: "",
  presentation: "",
  sectionsMasquees: [],
  projetIds: [],
  technologieIds: [],
  competenceIds: [],
};

export function valeursDeVersion(v: CvVersionDto): ValeursVersion {
  return {
    nom: v.nom,
    langue: v.langue,
    titrePoste: v.titrePoste ?? "",
    presentation: v.presentation ?? "",
    sectionsMasquees: v.sectionsMasquees,
    projetIds: v.projetIds,
    technologieIds: v.technologieIds,
    competenceIds: v.competenceIds,
  };
}

/** Le corps envoye a l'API : les textes vides deviennent nuls. */
export function corpsVersion(v: ValeursVersion) {
  return {
    ...v,
    nom: v.nom.trim(),
    titrePoste: v.titrePoste.trim() || null,
    presentation: v.presentation.trim() || null,
  };
}

const champ = "w-full px-3 py-2 border border-border rounded-md text-sm";

/** Ajoute ou retire un identifiant d'une liste. */
function basculer(liste: string[], id: string): string[] {
  return liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
}

/**
 * Une liste de cases a cocher. Rien de coche : tout est retenu, et la liste
 * le dit, pour qu'une version neuve ne paraisse pas vide.
 */
function Choix({
  titre,
  elements,
  coches,
  surChangement,
  aide,
  parDefaut = "Rien de coché : tout est retenu.",
}: {
  titre: string;
  elements: { id: string; libelle: string; detail?: string }[];
  coches: string[];
  surChangement: (ids: string[]) => void;
  aide: string;
  /** Ce que veut dire « rien de coche » pour cette liste. */
  parDefaut?: string;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-1">{titre}</legend>
      <p className="text-xs text-muted-foreground mb-2">
        {coches.length ? `${coches.length} retenu${coches.length > 1 ? "s" : ""}. ` : `${parDefaut} `}
        {aide}
      </p>
      {elements.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun pour l&apos;instant.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 max-h-64 overflow-y-auto rounded-md border border-border p-3">
          {elements.map((e) => (
            <label key={e.id} className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={coches.includes(e.id)}
                onChange={() => surChangement(basculer(coches, e.id))}
                className="mt-0.5"
              />
              <span>
                {e.libelle}
                {e.detail && <span className="block text-xs text-muted-foreground">{e.detail}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
      {coches.length > 0 && (
        <button
          type="button"
          onClick={() => surChangement([])}
          className="mt-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          Tout retenir
        </button>
      )}
    </fieldset>
  );
}

/**
 * La presentation que le CV prend quand la version n'a pas la sienne : la
 * regle du generateur, chaque presentation dans la langue du CV (le francais
 * a defaut), sinon son sous-titre, sinon son titre.
 */
function presentationDuSite(presentations: PresentationDto[], langue: ValeursVersion["langue"]): string {
  return presentations
    .map((p) => (langue === "en" ? p.descriptionEn || p.description : p.description) || p.subtitle || p.title)
    .filter(Boolean)
    .join(" ");
}

/**
 * Le formulaire d'une version du CV, partage par la creation et la
 * modification : son nom, sa langue, son titre et sa presentation, les
 * sections incluses, et ce qu'elle retient des projets, technologies et
 * competences libres.
 */
export function CvVersionForm({
  valeurs,
  onChange,
}: {
  valeurs: ValeursVersion;
  onChange: (v: ValeursVersion) => void;
}) {
  const [projets, setProjets] = useState<ProjectDto[]>([]);
  const [technologies, setTechnologies] = useState<TechnologyDto[]>([]);
  const [competences, setCompetences] = useState<SkillDto[]>([]);
  const [presentations, setPresentations] = useState<PresentationDto[]>([]);

  useEffect(() => {
    Promise.all([
      fetchEntities<ProjectDto>("projects"),
      fetchEntities<TechnologyDto>("technologies"),
      fetchEntities<SkillDto>("skills"),
      fetchEntities<PresentationDto>("presentations"),
    ])
      .then(([p, t, s, pr]) => {
        setPresentations(pr);
        setProjets(p);
        setTechnologies(t);
        // Les competences techniques passent par leurs technologies.
        setCompetences(s.filter((x) => !x.technologyId));
      })
      .catch(() => toast.error("Erreur de chargement des listes"));
  }, []);

  const maj = <K extends keyof ValeursVersion>(cle: K, v: ValeursVersion[K]) => onChange({ ...valeurs, [cle]: v });
  const duSite = presentationDuSite(presentations, valeurs.langue);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="version-nom" className="block text-sm font-medium mb-1">Nom de la version</label>
          <input
            id="version-nom"
            type="text"
            required
            maxLength={80}
            value={valeurs.nom}
            onChange={(e) => maj("nom", e.target.value)}
            placeholder="Ex : Back-end Java, banque"
            className={champ}
          />
          <p className="text-xs text-muted-foreground mt-1">Pour toi seulement : il n&apos;apparaît pas dans le CV.</p>
        </div>
        <div>
          <label htmlFor="version-langue" className="block text-sm font-medium mb-1">Langue</label>
          <select
            id="version-langue"
            value={valeurs.langue}
            onChange={(e) => maj("langue", e.target.value as ValeursVersion["langue"])}
            className={`${champ} bg-background`}
          >
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="version-titre" className="block text-sm font-medium mb-1">Titre du poste visé</label>
        <input
          id="version-titre"
          type="text"
          maxLength={120}
          value={valeurs.titrePoste}
          onChange={(e) => maj("titrePoste", e.target.value)}
          placeholder="Vide : celui des réglages du CV"
          className={champ}
        />
      </div>

      <div>
        <div className="flex items-end justify-between gap-3 mb-1">
          <label htmlFor="version-presentation" className="block text-sm font-medium">Présentation</label>
          {/* Retoucher le texte du site plutot que repartir de zero. */}
          {duSite && valeurs.presentation.trim() !== duSite && (
            <button
              type="button"
              onClick={() => maj("presentation", duSite)}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted"
            >
              Partir du texte du site
            </button>
          )}
        </div>
        <textarea
          id="version-presentation"
          rows={5}
          maxLength={2000}
          value={valeurs.presentation}
          onChange={(e) => maj("presentation", e.target.value)}
          placeholder={duSite ? `Vide, le CV reprend le texte du site : ${duSite}` : "Vide : la présentation du site"}
          aria-describedby="version-presentation-aide"
          className={champ}
        />
        <p id="version-presentation-aide" className="text-xs text-muted-foreground mt-1">
          Propre à cette version, dans sa langue. Vide, le CV reprend la présentation du site.
        </p>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium mb-1">Sections incluses</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {RANGS_DE_LA_BASE.map((s) => (
            <label key={s.cle} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!valeurs.sectionsMasquees.includes(s.cle)}
                onChange={() => maj("sectionsMasquees", basculer(valeurs.sectionsMasquees, s.cle))}
              />
              {s.titre.charAt(0) + s.titre.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </fieldset>

      <Choix
        titre="Projets"
        aide="Sous les expériences comme dans « Projets réalisés »."
        elements={projets.map((p) => ({ id: p.id, libelle: p.name }))}
        coches={valeurs.projetIds}
        surChangement={(ids) => maj("projetIds", ids)}
      />
      <Choix
        titre="Technologies"
        parDefaut="Rien de coché : celles marquées « dans le CV »."
        aide="Cochées : exactement celles-ci."
        elements={technologies.map((t) => ({ id: t.id, libelle: t.label, detail: t.family?.name }))}
        coches={valeurs.technologieIds}
        surChangement={(ids) => maj("technologieIds", ids)}
      />
      <Choix
        titre="Compétences libres"
        aide="Management, gestion de projet…"
        elements={competences.map((s) => ({ id: s.id, libelle: s.label ?? "", detail: s.family?.name }))}
        coches={valeurs.competenceIds}
        surChangement={(ids) => maj("competenceIds", ids)}
      />
    </>
  );
}
