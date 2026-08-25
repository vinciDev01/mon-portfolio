"use client";

/**
 * Formulaire partage par la creation et l'edition d'une section de CV.
 *
 * Le champ « rang » merite son explication : les sections issues de la base
 * occupent des rangs fixes, et c'est en s'intercalant entre eux que les
 * sections libres trouvent leur place dans le document.
 */

export const RANGS_DE_LA_BASE = [
  { rang: 10, titre: "PRÉSENTATION" },
  { rang: 30, titre: "TECHNOLOGIES" },
  { rang: 40, titre: "CERTIFICATIONS" },
  { rang: 50, titre: "EXPÉRIENCES PROFESSIONNELLES" },
  { rang: 60, titre: "PROJETS RÉALISÉS" },
] as const;

export type ValeursSection = {
  titre: string;
  lignes: string;
  publique: boolean;
  sortOrder: number;
};

export function CvSectionForm({
  valeurs,
  onChange,
}: {
  valeurs: ValeursSection;
  onChange: (v: ValeursSection) => void;
}) {
  const maj = (partiel: Partial<ValeursSection>) =>
    onChange({ ...valeurs, ...partiel });

  const voisines = RANGS_DE_LA_BASE.filter((s) => s.rang < valeurs.sortOrder);
  const precedente = voisines.length ? voisines[voisines.length - 1] : null;
  const suivante = RANGS_DE_LA_BASE.find((s) => s.rang > valeurs.sortOrder);

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
        <label className="block text-sm font-medium mb-1">
          Rang dans le CV : {valeurs.sortOrder}
        </label>
        <input
          type="number"
          value={valeurs.sortOrder}
          onChange={(e) => maj({ sortOrder: Number(e.target.value) })}
          min={0}
          max={999}
          className="w-full px-3 py-2 border border-border rounded-md text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {precedente || suivante ? (
            <>
              Cette section apparaîtra{" "}
              {precedente ? <>après <strong>{precedente.titre}</strong></> : <>en tête</>}
              {suivante ? <> et avant <strong>{suivante.titre}</strong></> : <> et en dernier</>}.
            </>
          ) : (
            <>Aucune section de la base n&apos;est actuellement définie.</>
          )}
        </p>
      </div>

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
