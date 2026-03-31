"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchEntities, deleteEntity, getFileUrl } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { OrganizationDto } from "@portfolio/shared-types";

export default function OrganizationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<OrganizationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntities<OrganizationDto>("organizations")
      .then(setItems)
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEntity("organizations", deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success("Organisation supprimée");
    } catch { toast.error("Erreur de suppression"); }
    setDeleteId(null);
  }

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <PageHeader title="Organisations" addHref="/organizations/new" />
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left">
          <th className="py-3 px-2">Logo</th><th className="py-3 px-2">Libellé</th><th className="py-3 px-2">Site web</th><th className="py-3 px-2 text-right">Actions</th>
        </tr></thead>
        <tbody>{items.map((item) => (
          <tr key={item.id} className="border-b border-border">
            <td className="py-3 px-2">{item.logoPath && <img src={getFileUrl(item.logoPath)!} alt="" className="h-8 w-8 object-contain" />}</td>
            <td className="py-3 px-2">{item.label}</td>
            <td className="py-3 px-2 text-xs text-muted-foreground">{item.websiteUrl}</td>
            <td className="py-3 px-2 text-right space-x-2">
              <button onClick={() => router.push(`/organizations/${item.id}/edit`)} className="text-xs px-3 py-1 rounded border border-border hover:bg-accent">Modifier</button>
              <button onClick={() => setDeleteId(item.id)} className="text-xs px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/90">Supprimer</button>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Aucune organisation</p>}
      <ConfirmDialog open={!!deleteId} title="Supprimer" message="Voulez-vous vraiment supprimer cette organisation ?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
