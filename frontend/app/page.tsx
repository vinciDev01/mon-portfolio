import { getPortfolioData } from "@/lib/api";
import { Header } from "@/components/portfolio/header";
import { Footer } from "@/components/portfolio/footer";
import { SectionShell } from "@/components/portfolio/section-shell";
import { PresentationSection } from "@/components/portfolio/presentation-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { ToastNotification } from "@/components/portfolio/toast-notification";
import { SectionToastObserver } from "@/components/portfolio/section-toast-observer";
import { MaintenancePage } from "@/components/portfolio/maintenance-page";
import { StatsSection } from "@/components/portfolio/stats-section";
import { ServicesSection } from "@/components/portfolio/services-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";
import { LampProvider } from "@/lib/lamp/lamp-context";
import { LampStage } from "@/components/lamp/lamp-stage";
import { LampSwitch } from "@/components/lamp/lamp-switch";

export default async function Page() {
  const data = await getPortfolioData();
  const s = data.siteSettings;

  if (s.maintenanceMode) return <MaintenancePage />;

  // Les sections dormantes gardent leur code mais ne comptent pas dans la
  // numerotation du parcours principal.
  let n = 0;
  const rang = () => ++n;

  return (
    <LampProvider
      reglages={{
        activee: s.lampEnabled,
        allumeeParDefaut: s.lampOnByDefault,
        ouverture: s.lampBeamAngle,
        intensite: s.lampIntensity,
        assombrissement: s.lampDimLevel,
      }}
    >
      <LampSwitch />
      <main className="min-h-screen">
        <SectionToastObserver />
        <Header siteSettings={s} personalInfo={data.personalInfo} />

        {s.showPresentations && (
          <SectionShell id="ouverture" titre="Ouverture" index={rang()}>
            <PresentationSection presentations={data.presentations} />
          </SectionShell>
        )}

        {s.showSkills && (
          <SectionShell id="competences" titre="Compétences" index={rang()}>
            <SkillsSection skills={data.skills} />
          </SectionShell>
        )}

        {s.showExperiences && (
          <SectionShell id="experience" titre="Expérience" index={rang()}>
            <ExperienceSection
              experiences={data.experiences}
              certifications={data.certifications}
              afficherCertifications={s.showCertifications}
            />
          </SectionShell>
        )}

        {s.showProjects && (
          <SectionShell id="projets" titre="Projets" index={rang()}>
            <ProjectsSection projects={data.projects} />
          </SectionShell>
        )}

        {s.showAbout && (
          <SectionShell id="a-propos" titre="À propos" index={rang()}>
            <AboutSection about={data.about} />
          </SectionShell>
        )}

        {s.showContact && (
          <SectionShell id="contact" titre="Contact" index={rang()}>
            <ContactSection />
          </SectionShell>
        )}

        {/* --- Sections dormantes, reactivables depuis le backoffice --- */}
        {s.showStats && (
          <SectionShell id="stats" titre="Chiffres" index={rang()}>
            <StatsSection stats={data.stats} />
          </SectionShell>
        )}
        {s.showServices && (
          <SectionShell id="services" titre="Services" index={rang()}>
            <ServicesSection services={data.services} />
          </SectionShell>
        )}
        {s.showTestimonials && (
          <SectionShell id="temoignages" titre="Témoignages" index={rang()}>
            <TestimonialsSection
              testimonials={data.testimonials}
              allowSubmission={s.allowTestimonialSubmission}
            />
          </SectionShell>
        )}

        <Footer personalInfo={data.personalInfo} />
        <ToastNotification message={s.toastMessage} delayMs={s.toastDelayMs} />
      </main>

      <LampStage />
    </LampProvider>
  );
}
