"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BlogPostDto } from "@portfolio/shared-types";
import { filtrerArticles, grouperParCategorie } from "@/lib/blog/recherche";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function CarteArticle({ post }: { post: BlogPostDto }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col rounded-xl border border-border overflow-hidden bg-card hover:shadow-md transition-shadow"
    >
      {post.coverImagePath && (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <Image
            src={`${API_URL}/uploads/${post.coverImagePath}`}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 p-5 flex-1">
        <time className="text-xs text-muted-foreground">
          {formatDate(post.publishedAt ?? post.createdAt)}
        </time>
        <h3 className="font-semibold text-lg leading-snug group-hover:underline decoration-1 underline-offset-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
        )}
      </div>
    </Link>
  );
}

const compte = (n: number) => `${n} article${n !== 1 ? "s" : ""}`;

/**
 * La recherche et les articles ranges par categorie. La recherche se fait
 * dans la page : les articles publies sont deja tous charges, et le resultat
 * suit chaque frappe. Les groupes se recalculent sur les seuls resultats,
 * donc une categorie sans resultat disparait.
 */
export function ExplorateurBlog({ articles }: { articles: BlogPostDto[] }) {
  const [requete, setRequete] = useState("");
  const resultats = filtrerArticles(articles, requete);
  const groupes = grouperParCategorie(resultats);
  const recherche = requete.trim() !== "";

  return (
    <>
      <div className="mb-10 max-w-xl">
        <label htmlFor="recherche-blog" className="block text-sm font-medium mb-2">
          Rechercher un article
        </label>
        <input
          id="recherche-blog"
          type="search"
          value={requete}
          onChange={(e) => setRequete(e.target.value)}
          placeholder="Titre, sujet, mot du texte"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm"
        />
        {/* Le nombre de resultats, annonce a chaque frappe aux lecteurs d'ecran
            et lisible par tous tant qu'une recherche est en cours. */}
        <p aria-live="polite" className={recherche ? "text-sm text-muted-foreground mt-2" : "sr-only"}>
          {recherche ? compte(resultats.length) : ""}
        </p>
      </div>

      {recherche && resultats.length === 0 && (
        <div className="text-muted-foreground">
          <p>Aucun article ne correspond à « {requete.trim()} ».</p>
          <button
            type="button"
            onClick={() => setRequete("")}
            className="mt-3 text-sm underline underline-offset-2 hover:text-foreground"
          >
            Effacer la recherche
          </button>
        </div>
      )}

      <div className="flex flex-col gap-14">
        {groupes.map(({ categorie, articles: liste }) => (
          <section key={categorie?.id ?? "sans-categorie"} aria-labelledby={`categorie-${categorie?.id ?? "aucune"}`}>
            <div className="flex items-baseline gap-3 mb-5">
              <h2 id={`categorie-${categorie?.id ?? "aucune"}`} className="text-2xl font-semibold tracking-tight">
                {categorie?.name ?? "Sans catégorie"}
              </h2>
              <span className="text-sm text-muted-foreground">{compte(liste.length)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liste.map((post) => (
                <CarteArticle key={post.id} post={post} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
