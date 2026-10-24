"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchEntities } from "@/lib/api";
import type { BlogCategoryDto } from "@portfolio/shared-types";

/**
 * La categorie d'un article, choisie dans la liste geree. Chaine vide :
 * aucune categorie, envoyee `null` a l'API par le formulaire.
 */
export function ChoixCategorie({
  valeur,
  surChangement,
}: {
  valeur: string;
  surChangement: (id: string) => void;
}) {
  const [categories, setCategories] = useState<BlogCategoryDto[]>([]);

  useEffect(() => {
    fetchEntities<BlogCategoryDto>("blog-categories")
      .then(setCategories)
      .catch(() => {});
  }, []);

  return (
    <div>
      <label htmlFor="article-categorie" className="block text-sm font-medium mb-1">
        Catégorie
      </label>
      <select
        id="article-categorie"
        value={valeur}
        onChange={(e) => surChangement(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
      >
        <option value="">Sans catégorie</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mt-1">
        Les catégories se gèrent dans{" "}
        <Link href="/blog-categories" className="underline">
          Catégories du blog
        </Link>
      </p>
    </div>
  );
}
