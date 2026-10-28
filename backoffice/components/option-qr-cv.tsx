"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchSingleton, updateSingleton } from "@/lib/api";
import type { SiteSettingsDto } from "@portfolio/shared-types";

/**
 * Le QR code du portfolio en tete du CV, reglable ici, a cote des sections :
 * la case s'enregistre des qu'on la coche. L'adresse qu'il encode reste dans
 * les parametres du site, ou elle sert au site entier ; sans elle, la case est
 * grisee. `surEnregistrement` : la page regenere alors l'apercu.
 */
export function OptionQrCv({ surEnregistrement }: { surEnregistrement: () => void }) {
  const [reglages, setReglages] = useState<Pick<SiteSettingsDto, "siteUrl" | "cvAfficherQr"> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSingleton<SiteSettingsDto>("site-settings")
      .then((r) => setReglages({ siteUrl: r.siteUrl, cvAfficherQr: r.cvAfficherQr }))
      .catch(() => toast.error("Erreur de chargement du réglage du QR code"));
  }, []);

  async function basculer(coche: boolean) {
    if (!reglages) return;
    setSaving(true);
    try {
      await updateSingleton("site-settings", { cvAfficherQr: coche });
      setReglages({ ...reglages, cvAfficherQr: coche });
      toast.success(coche ? "QR code ajouté au CV" : "QR code retiré du CV");
      surEnregistrement();
    } catch {
      toast.error("Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  if (!reglages) return null;

  return (
    <label className="mb-8 flex max-w-2xl items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={reglages.cvAfficherQr}
        onChange={(e) => basculer(e.target.checked)}
        disabled={saving || !reglages.siteUrl}
        className="mt-1"
      />
      <span>
        <span className="font-medium">Afficher le QR code du portfolio dans le CV</span>
        <span className="block text-xs text-muted-foreground mt-1">
          En haut à droite du CV : un recruteur qui l&apos;imprime ouvre le portfolio d&apos;un coup de téléphone.{" "}
          {reglages.siteUrl ? (
            <>Il mène à {reglages.siteUrl}.</>
          ) : (
            <>
              Renseignez d&apos;abord l&apos;adresse du portfolio dans les{" "}
              <Link href="/site-settings" className="underline underline-offset-2">
                paramètres du site
              </Link>
              .
            </>
          )}
        </span>
      </span>
    </label>
  );
}
