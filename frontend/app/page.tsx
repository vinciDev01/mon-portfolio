import { getPortfolioData } from "@/lib/api";
import { Header } from "@/components/portfolio/header";
import { PresentationSection } from "@/components/portfolio/presentation-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { CertificationsSection } from "@/components/portfolio/certifications-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { ServicesSection } from "@/components/portfolio/services-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { TestimonialsSection } from "@/components/portfolio/testimonials-section";
import { ContactSection } from "@/components/portfolio/contact-section";
import { Footer } from "@/components/portfolio/footer";
import { ToastNotification } from "@/components/portfolio/toast-notification";
import { Confetti } from "@/components/portfolio/confetti";
import { SectionToastObserver } from "@/components/portfolio/section-toast-observer";
import { ScrollAnimate } from "@/components/portfolio/scroll-animate";
import { StatsSection } from "@/components/portfolio/stats-section";
import { MaintenancePage } from "@/components/portfolio/maintenance-page";

export default async function Page() {
  const data = await getPortfolioData();
  const s = data.siteSettings;

  if (s.maintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <main className="min-h-screen">
      <Confetti />
      <SectionToastObserver />
      <Header siteSettings={s} personalInfo={data.personalInfo} />

      {s.showPresentations && (
        <ScrollAnimate>
          <PresentationSection presentations={data.presentations} />
        </ScrollAnimate>
      )}

      <ScrollAnimate delay={100}>
        <StatsSection stats={data.stats} />
      </ScrollAnimate>

      {s.showSkills && (
        <ScrollAnimate>
          <SkillsSection skills={data.skills} />
        </ScrollAnimate>
      )}

      {s.showExperiences && (
        <ScrollAnimate>
          <ExperienceSection experiences={data.experiences} />
        </ScrollAnimate>
      )}

      {s.showCertifications && (
        <ScrollAnimate>
          <CertificationsSection certifications={data.certifications} />
        </ScrollAnimate>
      )}

      {s.showProjects && (
        <ScrollAnimate>
          <ProjectsSection projects={data.projects} />
        </ScrollAnimate>
      )}

      {s.showServices && (
        <ScrollAnimate>
          <ServicesSection services={data.services} />
        </ScrollAnimate>
      )}

      {s.showAbout && (
        <ScrollAnimate>
          <AboutSection about={data.about} />
        </ScrollAnimate>
      )}

      {s.showTestimonials && (
        <ScrollAnimate>
          <TestimonialsSection
            testimonials={data.testimonials}
            allowSubmission={s.allowTestimonialSubmission}
          />
        </ScrollAnimate>
      )}

      {s.showContact && (
        <ScrollAnimate>
          <ContactSection />
        </ScrollAnimate>
      )}

      <Footer personalInfo={data.personalInfo} />
      <ToastNotification message={s.toastMessage} delayMs={s.toastDelayMs} />
    </main>
  );
}
