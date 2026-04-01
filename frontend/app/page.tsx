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

export default async function Page() {
  const data = await getPortfolioData();
  const s = data.siteSettings;

  return (
    <main className="min-h-screen">
      <Confetti />
      <SectionToastObserver />
      <Header siteSettings={s} personalInfo={data.personalInfo} />
      {s.showPresentations && <PresentationSection presentations={data.presentations} />}
      {s.showSkills && <SkillsSection skills={data.skills} />}
      {s.showExperiences && <ExperienceSection experiences={data.experiences} />}
      {s.showCertifications && <CertificationsSection certifications={data.certifications} />}
      {s.showProjects && <ProjectsSection projects={data.projects} />}
      {s.showServices && <ServicesSection services={data.services} />}
      {s.showAbout && <AboutSection about={data.about} />}
      {s.showTestimonials && <TestimonialsSection testimonials={data.testimonials} />}
      {s.showContact && <ContactSection />}
      <Footer personalInfo={data.personalInfo} />
      <ToastNotification
        message={s.toastMessage}
        delayMs={s.toastDelayMs}
      />
    </main>
  );
}
