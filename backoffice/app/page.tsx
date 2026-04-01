"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchEntities } from "@/lib/api";
import { toast } from "sonner";
import type { BlogPostDto } from "@portfolio/shared-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const sections = [
  { href: "/site-settings", label: "Paramètres du site", desc: "Logo, couleurs, police, toast, CV" },
  { href: "/personal-info", label: "Informations personnelles", desc: "Nom, email, réseaux sociaux" },
  { href: "/technologies", label: "Technologies", desc: "HTML, CSS, Go, Java, etc." },
  { href: "/organizations", label: "Organisations", desc: "Oracle, Azure, etc." },
  { href: "/presentations", label: "Présentations", desc: "Section héro du portfolio" },
  { href: "/skills", label: "Compétences", desc: "Technologies maîtrisées" },
  { href: "/experiences", label: "Expériences", desc: "Parcours professionnel" },
  { href: "/certifications", label: "Certifications", desc: "Diplômes et certifications" },
  { href: "/projects", label: "Projets", desc: "Projets réalisés" },
  { href: "/services", label: "Services", desc: "Services proposés" },
  { href: "/about", label: "À propos", desc: "Présentation personnelle" },
  { href: "/contact-messages", label: "Messages de contact", desc: "Messages reçus des visiteurs" },
  { href: "/testimonials", label: "Témoignages", desc: "Avis et témoignages clients" },
  { href: "/blog", label: "Blog", desc: "Articles publiés" },
];

interface ContactMessage {
  id: string;
  isRead: boolean;
}

interface Testimonial {
  id: string;
  isApproved: boolean;
}

interface Project {
  id: string;
}

interface Analytics {
  messagesTotal: number;
  messagesUnread: number;
  testimonialsTotal: number;
  testimonialsPending: number;
  projectsTotal: number;
  blogTotal: number;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchEntities<ContactMessage>("contact-messages").catch(() => [] as ContactMessage[]),
      fetchEntities<Testimonial>("testimonials").catch(() => [] as Testimonial[]),
      fetchEntities<Project>("projects").catch(() => [] as Project[]),
      fetchEntities<BlogPostDto>("blog/all").catch(() => [] as BlogPostDto[]),
    ])
      .then(([messages, testimonials, projects, blogPosts]) => {
        setAnalytics({
          messagesTotal: messages.length,
          messagesUnread: messages.filter((m) => !m.isRead).length,
          testimonialsTotal: testimonials.length,
          testimonialsPending: testimonials.filter((t) => !t.isApproved).length,
          projectsTotal: projects.length,
          blogTotal: blogPosts.length,
        });
      })
      .finally(() => setLoadingAnalytics(false));
  }, []);

  async function handleExportData() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("portfolio-admin-token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/export/data`, { headers });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  }

  async function handleGenerateCv() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("portfolio-admin-token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/cv-generator/generate`, { headers });
      if (!res.ok) throw new Error("CV generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cv-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CV généré et téléchargé");
    } catch {
      toast.error("Erreur lors de la génération du CV");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
      <p className="text-muted-foreground mb-8">
        Gérez le contenu de votre portfolio depuis cet espace.
      </p>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Messages</p>
          {loadingAnalytics ? (
            <p className="text-2xl font-bold text-muted-foreground">...</p>
          ) : (
            <>
              <p className="text-2xl font-bold">{analytics?.messagesTotal ?? 0}</p>
              {(analytics?.messagesUnread ?? 0) > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  {analytics?.messagesUnread} non lu{(analytics?.messagesUnread ?? 0) > 1 ? "s" : ""}
                </p>
              )}
              {(analytics?.messagesUnread ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">Tous lus</p>
              )}
            </>
          )}
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Témoignages</p>
          {loadingAnalytics ? (
            <p className="text-2xl font-bold text-muted-foreground">...</p>
          ) : (
            <>
              <p className="text-2xl font-bold">{analytics?.testimonialsTotal ?? 0}</p>
              {(analytics?.testimonialsPending ?? 0) > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">
                  {analytics?.testimonialsPending} en attente
                </p>
              )}
              {(analytics?.testimonialsPending ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">Tous approuvés</p>
              )}
            </>
          )}
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Projets</p>
          {loadingAnalytics ? (
            <p className="text-2xl font-bold text-muted-foreground">...</p>
          ) : (
            <>
              <p className="text-2xl font-bold">{analytics?.projectsTotal ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </>
          )}
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Articles</p>
          {loadingAnalytics ? (
            <p className="text-2xl font-bold text-muted-foreground">...</p>
          ) : (
            <>
              <p className="text-2xl font-bold">{analytics?.blogTotal ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={handleExportData}
          className="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
        >
          Exporter les données (JSON)
        </button>
        <button
          onClick={handleGenerateCv}
          className="px-4 py-2 rounded-md border border-border text-sm hover:bg-accent transition-colors"
        >
          Générer le CV (PDF)
        </button>
      </div>

      {/* Section links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block p-6 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <h2 className="font-semibold mb-1">{s.label}</h2>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
