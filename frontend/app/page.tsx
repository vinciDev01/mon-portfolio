import type { ReactNode } from "react";
import { connection } from "next/server";
import { getFileUrl, getPortfolioData } from "@/lib/api";
import { enJsonLd, fichePersonne, ficheSite, urlDuSite } from "@/lib/seo/seo";
import { Ampoule } from "@/components/ampoule/ampoule";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { FournisseurSectionActive, ParcoursPagine } from "@/components/parcours/parcours-pagine";
import { Medaillon } from "@/components/parcours/medaillon";
import { Footer } from "@/components/portfolio/footer";
import { LiensReseaux } from "@/components/portfolio/liens-reseaux";
import { SectionShell } from "@/components/portfolio/section-shell";
import { PresentationSection } from "@/components/portfolio/presentation-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { CertificationsSection } from "@/components/portfolio/certifications-section";
import { CoursSection } from "@/components/portfolio/cours-section";
import { JournalProjets } from "@/components/parcours/journal-projets";
import { AboutSection } from "@/components/portfolio/about-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { LigneDisponibilite } from "@/components/parcours/drapeau-disponibilite";
import { MaintenancePage } from "@/components/portfolio/maintenance-page";
import { StatsSection } from "@/components/portfolio/stats-section";
import { ServicesSection } from "@/components/portfolio/services-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";
import { sectionsActives } from "@/lib/parcours/sections";
import { scriptArrivee } from "@/lib/parcours/script-arrivee";

export default async function Page() {
  // Rendue a la demande, jamais au build : l'API n'est pas joignable pendant
  // `docker build`. Les donnees restent en cache 60 s (getPortfolioData).
  await connection();
  const data = await getPortfolioData();
  const s = data.siteSettings;

  if (s.maintenanceMode) return <MaintenancePage />;

  // Les reglages decident quelles sections existent (`sectionsActives`) ; la
  // table ci-dessous dit seulement ce que chacune contient. Le conteneur
  // rend, dans l'ordre de `sections`, le contenu que la table associe a
  // chaque identifiant.
  const sections = sectionsActives(s);

  // Le numero affiche suit la place dans le parcours rendu, pas dans la liste
  // complete : une section eteinte ne laisse pas de trou dans la numerotation.
  const rang = (id: string) => sections.findIndex((x) => x.id === id) + 1;

  const enfants: Record<string, ReactNode> = {
    // Section d'identite, toujours rendue : `showPresentations` ne commande
    // plus que les cartes de presentation, jamais le portrait. La ligne de
    // disponibilite vit ici et non au-dessus des sections : un element place
    // au-dessus des sections prendrait de la hauteur aux sections calibrees
    // sur celle de la fenetre.
    ouverture: (
      <SectionShell cleTitre="nav.presentation" index={rang("ouverture")} largeur="large">
        {/* Le portrait a cote du texte et non au-dessus : la section tient
            ainsi sur un ecran. */}
        <div className="ouverture-corps">
          {/* Le portrait et, dessous, les reseaux renseignes au backoffice :
              dans la colonne du portrait, ils n'ajoutent aucune hauteur. */}
          <div className="ouverture-identite">
            <Medaillon infos={data.personalInfo} />
            <LiensReseaux infos={data.personalInfo} />
          </div>
          <div className="ouverture-texte">
            <LigneDisponibilite etat={s.availabilityStatus} libelle={s.availabilityLabel} />
            {s.showPresentations && (
              <PresentationSection presentations={data.presentations} />
            )}
          </div>
        </div>
      </SectionShell>
    ),
    stats: (
      <SectionShell cleTitre="nav.stats" index={rang("stats")}>
        <StatsSection stats={data.stats} />
      </SectionShell>
    ),
    competences: (
      <SectionShell cleTitre="nav.skills" index={rang("competences")} largeur="large">
        <SkillsSection skills={data.skills} />
      </SectionShell>
    ),
    experience: (
      <SectionShell cleTitre="nav.experience" index={rang("experience")} largeur="large">
        <ExperienceSection experiences={data.experiences} />
      </SectionShell>
    ),
    certifications: (
      <SectionShell cleTitre="nav.certifications" index={rang("certifications")}>
        <CertificationsSection certifications={data.certifications} />
      </SectionShell>
    ),
    cours: (
      <SectionShell cleTitre="nav.cours" index={rang("cours")} largeur="large">
        <CoursSection cours={data.cours ?? []} />
      </SectionShell>
    ),
    projets: (
      <SectionShell cleTitre="nav.projects" index={rang("projets")}>
        <JournalProjets projets={data.projects} />
      </SectionShell>
    ),
    "a-propos": (
      <SectionShell cleTitre="nav.about" index={rang("a-propos")}>
        <AboutSection about={data.about} />
      </SectionShell>
    ),
    // Sections dormantes, reactivables depuis le backoffice.
    services: (
      <SectionShell cleTitre="nav.services" index={rang("services")}>
        <ServicesSection services={data.services} />
      </SectionShell>
    ),
    temoignages: (
      <SectionShell cleTitre="nav.testimonials" index={rang("temoignages")}>
        <TestimonialsSection
          testimonials={data.testimonials}
          allowSubmission={s.allowTestimonialSubmission}
        />
      </SectionShell>
    ),
    contact: (
      <SectionShell cleTitre="nav.contact" index={rang("contact")} largeur="tres-large">
        <ContactSection personalInfo={data.personalInfo} />
      </SectionShell>
    ),
  };

  // Les fiches de donnees structurees (schema.org) : la personne et le site,
  // que Google lit pour relier le portfolio a son auteur.
  const site = urlDuSite(data.siteSettings);
  const fiches = [fichePersonne(data, site, getFileUrl(data.personalInfo.avatarPath)), ficheSite(data, site)];

  return (
    <FournisseurSectionActive initial={sections[0]?.id ?? null}>
      {fiches.map((f, i) => (
        // Le contenu est echappe par `enJsonLd` : rien ne peut fermer la balise.
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: enJsonLd(f) }} />
      ))}
      {/* Avant le parcours : actualiser sur une section l'affiche aussitot,
          sans montrer l'accueil le temps que React demarre. */}
      <script dangerouslySetInnerHTML={{ __html: scriptArrivee(sections.map((x) => x.id)) }} />
      <Ampoule />
      <ColonnePassage reglages={s} infos={data.personalInfo} />
      <main className="min-h-screen">
        <ParcoursPagine
          sections={sections}
          enfants={enfants}
          pied={<Footer personalInfo={data.personalInfo} />}
        />
      </main>
    </FournisseurSectionActive>
  );
}
