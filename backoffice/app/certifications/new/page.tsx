"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEntity, fetchEntities } from "@/lib/api";
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import type { OrganizationDto } from "@portfolio/shared-types";

export default function NewCertificationPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [name, setName] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState("");
  const [description, setDescription] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEntities<OrganizationDto>("organizations").then(setOrgs).catch(() => {}); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) { toast.error("Sélectionnez une organisation"); return; }
    setSaving(true);
    try {
      await createEntity("certifications", {
        name, imagePath, organizationId, description: description || null,
        issueDate: issueDate ? new Date(issueDate).toISOString() : null,
        credentialUrl: credentialUrl || null, sortOrder,
      });
      toast.success("Certification créée");
      router.push("/certifications");
    } catch { toast.error("Erreur"); } finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-8">Nouvelle certification</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Nom</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <ImageUpload currentPath={imagePath} category="certifications" onUpload={setImagePath} label="Image" />
        <div>
          <label className="block text-sm font-medium mb-1">Organisation</label>
          <select value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} required className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background">
            <option value="">-- Sélectionner --</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Date d&apos;obtention</label><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Lien certification</label><input type="url" value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Ordre</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-md text-sm" /></div>
        <button type="submit" disabled={saving} className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? "Création..." : "Créer"}</button>
      </form>
    </div>
  );
}
