"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchSingleton, updateSingleton } from "@/lib/api";
import { TelechargementCv } from "@/components/telechargement-cv";
import type { SiteSettingsDto } from "@portfolio/shared-types";

type Reglages = Pick<
  SiteSettingsDto,
  "cvFontFamily" | "siteUrl" | "cvAfficherQr" | "showCvDownload" | "cvFaitA" | "cvLieu" | "cvDateFaitA" | "cvEspaceSignature"
>;

const champ = "w-full px-3 py-2 border border-border rounded-md text-sm";

/**
 * Les reglages du CV telechargeable, sur la page des sections du CV : la
 * police, l'adresse du portfolio et son QR code, la publication sur le site,
 * et le telechargement. Chaque reglage s'enregistre aussitot (l'adresse, par
 * son bouton) ; `surEnregistrement` regenere alors l'apercu.
 */
export function ReglagesCv({ surEnregistrement }: { surEnregistrement: () => void }) {
  const [reglages, setReglages] = useState<Reglages | null>(null);
  const [adresse, setAdresse] = useState("");
  // Le lieu et la date du « Fait a » : enregistres ensemble, par leur bouton.
  const [lieu, setLieu] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSingleton<SiteSettingsDto>("site-settings")
      .then((r) => {
        setReglages({
          cvFontFamily: r.cvFontFamily,
          cvFaitA: r.cvFaitA,
          cvLieu: r.cvLieu,
          cvDateFaitA: r.cvDateFaitA,
          cvEspaceSignature: r.cvEspaceSignature,
          siteUrl: r.siteUrl,
          cvAfficherQr: r.cvAfficherQr,
          showCvDownload: r.showCvDownload,
        });
        setAdresse(r.siteUrl ?? "");
        setLieu(r.cvLieu ?? "");
        // L'API rend une date complete : le champ n'en garde que le jour.
        setDate(r.cvDateFaitA ? r.cvDateFaitA.slice(0, 10) : "");
      })
      .catch(() => toast.error("Erreur de chargement des réglages du CV"));
  }, []);

  async function enregistrer(partiel: Partial<Reglages>, message: string) {
    if (!reglages) return;
    setSaving(true);
    try {
      await updateSingleton("site-settings", partiel);
      setReglages({ ...reglages, ...partiel });
      toast.success(message);
      surEnregistrement();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (!reglages) return null;

  const adresseModifiee = adresse.trim() !== (reglages.siteUrl ?? "");

  return (
    <fieldset className="mb-8 max-w-2xl border border-border rounded-md p-4 space-y-4">
      <legend className="text-sm font-semibold px-2">CV téléchargeable</legend>

      <div>
        <label htmlFor="cv-police" className="block text-sm font-medium mb-1">Police du CV</label>
        <select
          id="cv-police"
          value={reglages.cvFontFamily}
          disabled={saving}
          onChange={(e) => enregistrer({ cvFontFamily: e.target.value }, "Police du CV enregistrée")}
          className={`${champ} bg-background`}
        >
          <option value="serif">Serif (Times)</option>
          <option value="sans">Sans-serif (Helvetica)</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Le serif suit le canevas d&apos;origine du CV ; le sans-serif s&apos;accorde avec la police du site.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const valeur = adresse.trim();
          if (valeur && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(valeur)) {
            toast.error("L'adresse doit être complète et commencer par http:// ou https://");
            return;
          }
          void enregistrer({ siteUrl: valeur || null }, valeur ? "Adresse du portfolio enregistrée" : "Adresse du portfolio retirée");
        }}
      >
        <label htmlFor="site-url" className="block text-sm font-medium mb-1">Adresse publique du portfolio</label>
        <div className="flex gap-2">
          <input
            id="site-url"
            type="url"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="https://fanuel-benyo.dev"
            className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
          />
          <button
            type="submit"
            disabled={saving || !adresseModifiee}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Ajoutée aux coordonnées du CV, en lien. Vide : ni lien ni QR code.
        </p>
      </form>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={reglages.cvAfficherQr}
          disabled={saving || !reglages.siteUrl}
          onChange={(e) =>
            enregistrer({ cvAfficherQr: e.target.checked }, e.target.checked ? "QR code ajouté au CV" : "QR code retiré du CV")
          }
          className="mt-1"
        />
        <span>
          <span className="font-medium">Afficher le QR code du portfolio dans le CV</span>
          <span className="block text-xs text-muted-foreground mt-1">
            En haut à droite du CV : un recruteur qui l&apos;imprime ouvre le portfolio d&apos;un coup de téléphone.
            {!reglages.siteUrl && " Renseignez d'abord l'adresse du portfolio ci-dessus."}
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={reglages.showCvDownload}
          disabled={saving}
          onChange={(e) =>
            enregistrer(
              { showCvDownload: e.target.checked },
              e.target.checked ? "CV proposé sur le site" : "CV retiré du site",
            )
          }
          className="mt-1"
        />
        <span>
          <span className="font-medium">Proposer le téléchargement du CV sur le site</span>
          <span className="block text-xs text-muted-foreground mt-1">
            Décoché, aucun bouton n&apos;apparaît et l&apos;adresse de téléchargement répond « introuvable ». Coché, les
            visiteurs peuvent récupérer votre CV <strong>au format Word uniquement</strong>. Le PDF reste réservé au
            backoffice.
          </span>
        </span>
      </label>

      <fieldset className="pt-2 border-t border-border space-y-3">
        <legend className="sr-only">Lieu, date et signature</legend>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={reglages.cvFaitA}
            disabled={saving}
            onChange={(e) =>
              enregistrer({ cvFaitA: e.target.checked }, e.target.checked ? "« Fait à … le … » ajouté au CV" : "« Fait à … le … » retiré du CV")
            }
            className="mt-1"
          />
          <span>
            <span className="font-medium">Terminer le CV par « Fait à …, le … »</span>
            <span className="block text-xs text-muted-foreground mt-1">
              En bas à droite, pour un CV à dater et à signer. Sans lieu, une ligne en pointillés à remplir à la main ;
              sans date, celle du jour où le CV est généré.
            </span>
          </span>
        </label>

        <form
          className={reglages.cvFaitA ? "" : "opacity-50"}
          onSubmit={(e) => {
            e.preventDefault();
            void enregistrer(
              { cvLieu: lieu.trim() || null, cvDateFaitA: date || null },
              "Lieu et date enregistrés",
            );
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <label htmlFor="cv-lieu" className="block text-sm font-medium mb-1">Fait à</label>
              <input
                id="cv-lieu"
                type="text"
                maxLength={80}
                value={lieu}
                onChange={(e) => setLieu(e.target.value)}
                disabled={!reglages.cvFaitA}
                placeholder="Vide : …………… à remplir"
                className={champ}
              />
            </div>
            <div>
              <label htmlFor="cv-date" className="block text-sm font-medium mb-1">Le</label>
              <input
                id="cv-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!reglages.cvFaitA}
                className={champ}
              />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={
                saving ||
                !reglages.cvFaitA ||
                (lieu.trim() === (reglages.cvLieu ?? "") && date === (reglages.cvDateFaitA?.slice(0, 10) ?? ""))
              }
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              Enregistrer
            </button>
            {date && reglages.cvFaitA && (
              <button
                type="button"
                onClick={() => setDate("")}
                className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
              >
                Date du jour à chaque génération
              </button>
            )}
          </div>
        </form>

        <label className={`flex items-start gap-3 text-sm ${reglages.cvFaitA ? "" : "opacity-50"}`}>
          <input
            type="checkbox"
            checked={reglages.cvEspaceSignature}
            disabled={saving || !reglages.cvFaitA}
            onChange={(e) =>
              enregistrer(
                { cvEspaceSignature: e.target.checked },
                e.target.checked ? "Espace de signature réservé" : "Espace de signature retiré",
              )
            }
            className="mt-1"
          />
          <span>
            <span className="font-medium">Réserver un espace pour signer</span>
            <span className="block text-xs text-muted-foreground mt-1">Environ 3,5 cm de blanc sous la date.</span>
          </span>
        </label>
      </fieldset>

      <div className="pt-2 border-t border-border">
        <p className="text-sm font-medium mb-2">Récupérer le CV</p>
        <p className="text-xs text-muted-foreground mb-3">
          Généré à l&apos;instant depuis vos données. Le PDF n&apos;est jamais accessible aux visiteurs.
        </p>
        <TelechargementCv />
      </div>
    </fieldset>
  );
}
