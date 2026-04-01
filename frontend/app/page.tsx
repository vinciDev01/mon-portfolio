import { getPortfolioData } from "@/lib/api";
import { Header } from "@/components/portfolio/header";
import { PresentationSection } from "@/components/portfolio/presentation-section";
import { SkillsSection } from "@/components/portfolio/skills-section";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { CertificationsSection } from "@/components/portfolio/certifications-section";
import { ProjectsSection } from "@/components/portfolio/projects-section";
import { ServicesSection } from "@/components/portfolio/services-section";
import { AboutSection } from "@/components/portfolio/about-section";
import { Footer } from "@/components/portfolio/footer";
import { ToastNotification } from "@/components/portfolio/toast-notification";
import { Confetti } from "@/components/portfolio/confetti";
import { SectionToastObserver } from "@/components/portfolio/section-toast-observer";

export default async function Page() {
  const data = await getPortfolioData();

  return (
    <main className="min-h-screen">
      <Confetti />
      <SectionToastObserver />
      <Header siteSettings={data.siteSettings} personalInfo={data.personalInfo} />
      <PresentationSection presentations={data.presentations} />
      <SkillsSection skills={data.skills} />
      <ExperienceSection experiences={data.experiences} />
      <CertificationsSection certifications={data.certifications} />
      <ProjectsSection projects={data.projects} />
      <ServicesSection services={data.services} />
      <AboutSection about={data.about} />
      <Footer personalInfo={data.personalInfo} />
      <ToastNotification
        message={data.siteSettings.toastMessage}
        delayMs={data.siteSettings.toastDelayMs}
      />
    </main>
  );
}
