"use client";

import { useEffect, useState } from "react";
import { fetchSingleton, updateSingleton, uploadFile } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { SiteSettingsDto } from "@portfolio/shared-types";
import { ratioContraste, melanger } from "@/lib/contrast";

export default function SiteSettingsPage() {
  const [data, setData] = useState<SiteSettingsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSingleton<SiteSettingsDto>("site-settings")
      .then(setData)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      const { id, ...rest } = data;
      await updateSingleton("site-settings", rest);
      toast.success("Paramètres sauvegardés");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadFile(file, "cv");
      setData((d) => d ? { ...d, cvFilePath: path } : d);
      toast.success("CV uploadé");
    } catch {
      toast.error("Erreur upload CV");
    }
  }

  if (loading) return <p>Chargement...</p>;
  if (!data) return <p>Erreur de chargement des paramètres.</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Paramètres du site</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <ImageUpload
            label="Favicon"
            currentPath={data.faviconPath}
            category="site"
            onUpload={(p) => setData({ ...data, faviconPath: p })}
          />
          <ImageUpload
            label="Logo"
            currentPath={data.logoPath}
            category="site"
            onUpload={(p) => setData({ ...data, logoPath: p })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Couleur de fond</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.bgColor}
                onChange={(e) => setData({ ...data, bgColor: e.target.value })}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={data.bgColor}
                onChange={(e) => setData({ ...data, bgColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Format hexadécimal (ex: #131518)</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Couleur du texte</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={data.textColor}
                onChange={(e) => setData({ ...data, textColor: e.target.value })}
                className="h-10 w-14 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={data.textColor}
                onChange={(e) => setData({ ...data, textColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Format hexadécimal (ex: #E4E5E3)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Taille de police (px)</label>
            <input
              type="number"
              value={data.fontSize}
              onChange={(e) => setData({ ...data, fontSize: Number(e.target.value) })}
              min={8}
              max={32}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">Entre 8 et 32 px</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Police</label>
            <input
              type="text"
              value={data.fontFamily}
              onChange={(e) => setData({ ...data, fontFamily: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Langue par défaut</label>
          <select
            value={data.defaultLanguage}
            onChange={(e) => setData({ ...data, defaultLanguage: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">Langue affichée par défaut pour les visiteurs</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Message Toast</label>
          <input
            type="text"
            value={data.toastMessage || ""}
            onChange={(e) => setData({ ...data, toastMessage: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Délai du toast (minutes)</label>
          <input
            type="number"
            value={Math.round(data.toastDelayMs / 60000)}
            onChange={(e) => setData({ ...data, toastDelayMs: Number(e.target.value) * 60000 })}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            min={1}
          />
          <p className="text-xs text-muted-foreground mt-1">Minimum 1 minute</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">CV (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleCvUpload}
            className="w-full text-sm"
          />
          {data.cvFilePath && (
            <p className="text-xs text-muted-foreground mt-1">Fichier actuel : {data.cvFilePath}</p>
          )}
        </div>

        {/* Section visibility toggles */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Visibilité des sections</h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "showPresentations", label: "Présentations" },
              { key: "showSkills", label: "Compétences" },
              { key: "showExperiences", label: "Expériences" },
              { key: "showCertifications", label: "Certifications" },
              { key: "showProjects", label: "Projets" },
              { key: "showServices", label: "Services" },
              { key: "showAbout", label: "À propos" },
              { key: "showTestimonials", label: "Témoignages" },
              { key: "showContact", label: "Contact" },
              { key: "allowTestimonialSubmission", label: "Autoriser l'envoi de témoignages" },
              { key: "maintenanceMode", label: "Mode maintenance" },
            ] as const).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={data[key]}
                  onChange={(e) => setData({ ...data, [key]: e.target.checked })}
                  className="rounded border-border"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Disponibilité */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Disponibilité</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                value={data.availabilityStatus}
                onChange={(e) => setData({ ...data, availabilityStatus: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="available">Disponible</option>
                <option value="busy">Occupé</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label personnalisé</label>
              <input
                type="text"
                value={data.availabilityLabel || ""}
                onChange={(e) => setData({ ...data, availabilityLabel: e.target.value })}
                placeholder="Ex: Disponible pour freelance"
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div>
          <h2 className="text-lg font-semibold mb-3">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titre SEO</label>
              <input
                type="text"
                value={data.seoTitle || ""}
                onChange={(e) => setData({ ...data, seoTitle: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                placeholder="Titre affiché dans les résultats de recherche"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description SEO</label>
              <textarea
                value={data.seoDescription || ""}
                onChange={(e) => setData({ ...data, seoDescription: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
                placeholder="Description affichée dans les résultats de recherche"
              />
            </div>
            <ImageUpload
              label="Image SEO (Open Graph)"
              currentPath={data.seoImagePath}
              category="site"
              onUpload={(p) => setData({ ...data, seoImagePath: p })}
            />
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Notifications</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Email de notification</label>
            <input
              type="email"
              value={data.notificationEmail || ""}
              onChange={(e) => setData({ ...data, notificationEmail: e.target.value })}
              placeholder="Email pour recevoir les notifications"
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cet email recevra les nouveaux messages de contact et témoignages
            </p>
          </div>
        </div>

        {/* --- Lampe d'atelier --- */}
        <fieldset className="border border-border rounded-md p-4 space-y-4">
          <legend className="text-sm font-semibold px-2">Lampe d&apos;atelier</legend>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={data.lampEnabled}
              onChange={(e) => setData({ ...data, lampEnabled: e.target.checked })}
            />
            Lampe activée sur le site
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={data.lampOnByDefault}
              onChange={(e) => setData({ ...data, lampOnByDefault: e.target.checked })}
            />
            Allumée dès l&apos;arrivée du visiteur
          </label>

          <div>
            <label className="block text-sm font-medium mb-1">
              Ouverture du faisceau : {data.lampBeamAngle}°
            </label>
            <input
              type="range" min={8} max={45}
              value={data.lampBeamAngle}
              onChange={(e) => setData({ ...data, lampBeamAngle: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Intensité : {data.lampIntensity}%
            </label>
            <input
              type="range" min={0} max={100}
              value={data.lampIntensity}
              onChange={(e) => setData({ ...data, lampIntensity: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Assombrissement hors faisceau : {data.lampDimLevel}%
            </label>
            <input
              type="range" min={0} max={65}
              value={data.lampDimLevel}
              onChange={(e) => setData({ ...data, lampDimLevel: Number(e.target.value) })}
              className="w-full"
            />
            {(() => {
              // Texte secondaire de la palette (dates, metadonnees, numeros
              // de section, pied de page) : voir frontend/lib/design/tokens.ts
              const TEXTE_SECONDAIRE = "#8B8F8A";
              const taux = data.lampDimLevel / 100;
              const fond = melanger(data.bgColor, "#0D0F11", taux);
              const textePrincipal = melanger(data.textColor, "#0D0F11", taux);
              const texteSecondaire = melanger(TEXTE_SECONDAIRE, "#0D0F11", taux);
              const ratioPrincipal = ratioContraste(textePrincipal, fond);
              const ratioSecondaire = ratioContraste(texteSecondaire, fond);
              const ratioMinimum = Math.min(ratioPrincipal, ratioSecondaire);
              const conforme = ratioMinimum >= 4.5;
              return (
                <p className={`text-xs mt-1 ${conforme ? "text-muted-foreground" : "text-red-600"}`}>
                  Contraste hors faisceau — texte principal {ratioPrincipal.toFixed(2)}:1, texte
                  secondaire {ratioSecondaire.toFixed(2)}:1 —{" "}
                  {conforme
                    ? "conforme AA"
                    : `sous le seuil AA de 4.5:1 (pire cas ${ratioMinimum.toFixed(2)}:1)`}
                </p>
              );
            })()}
          </div>
        </fieldset>

        {/* --- CV genere --- */}
<fieldset className="border border-border rounded-md p-4 space-y-4">
  <legend className="text-sm font-semibold px-2">CV téléchargeable</legend>
  <div>
    <label className="block text-sm font-medium mb-1">Police du CV</label>
    <select
      value={data.cvFontFamily}
      onChange={(e) => setData({ ...data, cvFontFamily: e.target.value })}
      className="w-full px-3 py-2 border border-border rounded-md text-sm"
    >
      <option value="serif">Serif (Times)</option>
      <option value="sans">Sans-serif (Helvetica)</option>
    </select>
    <p className="text-xs text-muted-foreground mt-1">
      Le serif suit le canevas d&apos;origine du CV ; le sans-serif s&apos;accorde
      avec la police du site.
    </p>
  </div>
</fieldset>

{/* --- Rythme --- */}
        <fieldset className="border border-border rounded-md p-4 space-y-4">
          <legend className="text-sm font-semibold px-2">Rythme</legend>

          <div>
            <label className="block text-sm font-medium mb-1">Échelle typographique</label>
            <select
              value={data.typeScale}
              onChange={(e) => setData({ ...data, typeScale: e.target.value as typeof data.typeScale })}
              className="w-full px-3 py-2 border border-border rounded-md text-sm"
            >
              <option value="compact">Compacte (ratio 1.200)</option>
              <option value="normal">Normale (ratio 1.250)</option>
              <option value="airy">Aérée (ratio 1.333)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Interligne du corps : {data.lineHeight.toFixed(2)}
            </label>
            <input
              type="range" min={1.3} max={2} step={0.05}
              value={data.lineHeight}
              onChange={(e) => setData({ ...data, lineHeight: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Amplitude du zigzag : {data.zigzagAmplitude}%
            </label>
            <input
              type="range" min={0} max={100}
              value={data.zigzagAmplitude}
              onChange={(e) => setData({ ...data, zigzagAmplitude: Number(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 = colonne unique centrée · 100 = décalage maximal
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Espace entre sections : {data.sectionSpacing} px
            </label>
            <input
              type="range" min={64} max={240} step={8}
              value={data.sectionSpacing}
              onChange={(e) => setData({ ...data, sectionSpacing: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </fieldset>

        {/* --- Mouvement --- */}
        <fieldset className="border border-border rounded-md p-4 space-y-4">
          <legend className="text-sm font-semibold px-2">Mouvement</legend>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={data.animationsEnabled}
              onChange={(e) => setData({ ...data, animationsEnabled: e.target.checked })}
            />
            Animations activées
          </label>

          <div>
            <label className="block text-sm font-medium mb-1">
              Vitesse globale : {data.animationSpeed.toFixed(2)}×
            </label>
            <input
              type="range" min={0.5} max={2} step={0.05}
              value={data.animationSpeed}
              onChange={(e) => setData({ ...data, animationSpeed: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={data.respectReducedMotion}
              onChange={(e) => setData({ ...data, respectReducedMotion: e.target.checked })}
            />
            Respecter les préférences système de mouvement réduit
          </label>
        </fieldset>

        {/* --- Accent --- */}
        <fieldset className="border border-border rounded-md p-4 space-y-4">
          <legend className="text-sm font-semibold px-2">Accent</legend>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Teinte : {data.accentHue}°</label>
              <input
                type="range" min={0} max={360}
                value={data.accentHue}
                onChange={(e) => setData({ ...data, accentHue: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Saturation : {data.accentSaturation}%
              </label>
              <input
                type="range" min={0} max={30}
                value={data.accentSaturation}
                onChange={(e) => setData({ ...data, accentSaturation: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Plafonnée à 30 : aucune couleur vive possible
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="h-8 w-16 rounded border border-border"
              style={{ background: `hsl(${data.accentHue} ${data.accentSaturation}% 54%)` }}
            />
            <code className="text-xs text-muted-foreground">
              hsl({data.accentHue} {data.accentSaturation}% 54%)
            </code>
          </div>
        </fieldset>

        {/* --- Visibilité de la section Stats --- */}
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={data.showStats}
            onChange={(e) => setData({ ...data, showStats: e.target.checked })}
          />
          Afficher la section Statistiques
        </label>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}
