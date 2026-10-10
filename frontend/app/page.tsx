import { getPortfolioData } from "@/lib/api";
import { Ampoule } from "@/components/ampoule/ampoule";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { Footer } from "@/components/portfolio/footer";
import { SectionShell } from "@/components/portfolio/section-shell";
import { PresentationSection } from "@/components/portfolio/presentation-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { ToastNotification } from "@/components/portfolio/toast-notification";
import { LigneDisponibilite } from "@/components/parcours/drapeau-disponibilite";
import { SectionToastObserver } from "@/components/portfolio/section-toast-observer";
import { MaintenancePage } from "@/components/portfolio/maintenance-page";
import { StatsSection } from "@/components/portfolio/stats-section";
import { ServicesSection } from "@/components/portfolio/services-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";

export default async function Page() {
  const data = await getPortfolioData();
  const s = data.siteSettings;

  if (s.maintenanceMode) return <MaintenancePage />;

  // Les sections dormantes gardent leur code mais ne comptent pas dans la
  // numerotation du parcours principal.
  let n = 0;
  const rang = () => ++n;

  return (
    <>
      <Ampoule />
      <ColonnePassage reglages={s} infos={data.personalInfo} />
      <main className="min-h-screen">
        <SectionToastObserver />

        {/* Sous 1024 px le drapeau n'a plus de texte : le message vit ici, hors
            de toute condition de section, pour ne jamais disparaitre. */}
        <LigneDisponibilite
          etat={s.availabilityStatus}
          libelle={s.availabilityLabel}
        />

        {s.showPresentations && (
          <SectionShell id="ouverture" cleTitre="section.ouverture" index={rang()}>
            <PresentationSection presentations={data.presentations} />
          </SectionShell>
        )}

        {s.showStats && (
          <SectionShell id="stats" cleTitre="section.stats" index={rang()}>
            <StatsSection stats={data.stats} />
          </SectionShell>
        )}

        {s.showSkills && (
          <SectionShell id="competences" cleTitre="section.skills" index={rang()}>
            <SkillsSection skills={data.skills} />
          </SectionShell>
        )}

        {s.showExperiences && (
          <SectionShell id="experience" cleTitre="section.experience" index={rang()}>
            <ExperienceSection
              experiences={data.experiences}
              certifications={data.certifications}
              afficherCertifications={s.showCertifications}
            />
          </SectionShell>
        )}

        {s.showProjects && (
          <SectionShell id="projets" cleTitre="section.projects" index={rang()}>
            <ProjectsSection projects={data.projects} />
          </SectionShell>
        )}

        {s.showAbout && (
          <SectionShell id="a-propos" cleTitre="section.about" index={rang()}>
            <AboutSection about={data.about} />
          </SectionShell>
        )}

        {s.showContact && (
          <SectionShell id="contact" cleTitre="section.contact" index={rang()}>
            <ContactSection />
          </SectionShell>
        )}

        {/* --- Sections dormantes, reactivables depuis le backoffice --- */}
        {s.showServices && (
          <SectionShell id="services" cleTitre="section.services" index={rang()}>
            <ServicesSection services={data.services} />
          </SectionShell>
        )}
        {s.showTestimonials && (
          <SectionShell id="temoignages" cleTitre="section.testimonials" index={rang()}>
            <TestimonialsSection
              testimonials={data.testimonials}
              allowSubmission={s.allowTestimonialSubmission}
            />
          </SectionShell>
        )}

        <Footer personalInfo={data.personalInfo} />
        <ToastNotification message={s.toastMessage} delayMs={s.toastDelayMs} />
      </main>
    </>
  );
}
