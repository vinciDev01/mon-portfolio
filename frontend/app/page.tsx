import type { ReactNode } from "react";
import { getPortfolioData } from "@/lib/api";
import { Ampoule } from "@/components/ampoule/ampoule";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { FournisseurSectionActive, ParcoursPagine } from "@/components/parcours/parcours-pagine";
import { Medaillon } from "@/components/parcours/medaillon";
import { Footer } from "@/components/portfolio/footer";
import { SectionShell } from "@/components/portfolio/section-shell";
import { PresentationSection } from "@/components/portfolio/presentation-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { JournalProjets } from "@/components/parcours/journal-projets";
import { AboutSection } from "@/components/portfolio/about-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { ToastNotification } from "@/components/portfolio/toast-notification";
import { LigneDisponibilite } from "@/components/parcours/drapeau-disponibilite";
import { SectionToastObserver } from "@/components/portfolio/section-toast-observer";
import { MaintenancePage } from "@/components/portfolio/maintenance-page";
import { StatsSection } from "@/components/portfolio/stats-section";
import { ServicesSection } from "@/components/portfolio/services-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";
import { sectionsActives } from "@/lib/parcours/sections";

export default async function Page() {
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
      <SectionShell cleTitre="nav.presentation" index={rang("ouverture")}>
        <Medaillon infos={data.personalInfo} />
        <LigneDisponibilite etat={s.availabilityStatus} libelle={s.availabilityLabel} />
        {s.showPresentations && (
          <PresentationSection presentations={data.presentations} />
        )}
      </SectionShell>
    ),
    stats: (
      <SectionShell cleTitre="nav.stats" index={rang("stats")}>
        <StatsSection stats={data.stats} />
      </SectionShell>
    ),
    competences: (
      <SectionShell cleTitre="nav.skills" index={rang("competences")}>
        <SkillsSection skills={data.skills} />
      </SectionShell>
    ),
    experience: (
      <SectionShell cleTitre="nav.experience" index={rang("experience")}>
        <ExperienceSection
          experiences={data.experiences}
          certifications={data.certifications}
          afficherCertifications={s.showCertifications}
        />
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
    contact: (
      <SectionShell cleTitre="nav.contact" index={rang("contact")}>
        <ContactSection />
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
  };

  return (
    <FournisseurSectionActive initial={sections[0]?.id ?? null}>
      <Ampoule />
      <ColonnePassage reglages={s} infos={data.personalInfo} />
      <main className="min-h-screen">
        <SectionToastObserver />
        <ParcoursPagine
          sections={sections}
          enfants={enfants}
          pied={<Footer personalInfo={data.personalInfo} />}
        />
        <ToastNotification message={s.toastMessage} delayMs={s.toastDelayMs} />
      </main>
    </FournisseurSectionActive>
  );
}
