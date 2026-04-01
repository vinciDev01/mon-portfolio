import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // --- SiteSettings (singleton) ---
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        bgColor: "#F0E68C",
        textColor: "#000000",
        fontSize: 16,
        fontFamily: "Figtree",
        toastMessage: "Merci de visiter mon portfolio !",
        toastDelayMs: 180000,
        showPresentations: true,
        showSkills: true,
        showExperiences: true,
        showCertifications: true,
        showProjects: true,
        showServices: true,
        showAbout: true,
        showContact: true,
        showTestimonials: true,
        allowTestimonialSubmission: true,
        defaultLanguage: "fr",
        availabilityStatus: "available",
        availabilityLabel: "Disponible pour freelance",
        maintenanceMode: false,
        seoTitle: "Fanuel BENYO - Developpeur d'Applications",
        seoDescription: "Portfolio professionnel de Fanuel BENYO. Developpeur Java Spring Boot, Flutter, Web.",
      },
    });
    console.log("✔ SiteSettings seeded");
  }

  // --- PersonalInfo (singleton) ---
  const existingInfo = await prisma.personalInfo.findFirst();
  if (!existingInfo) {
    await prisma.personalInfo.create({
      data: {
        name: "BENYO",
        surname: "Fanuel Kokou",
        email: "benyofanuel@gmail.com",
        bio: "Développeur d'applications passionné, spécialisé en Java Spring Boot et technologies web. Actuellement en stage chez OssanAsur, je conçois des solutions logicielles robustes et modernes.",
      },
    });
    console.log("✔ PersonalInfo seeded");
  }

  // --- Organizations ---
  const fortinet = await prisma.organization.upsert({
    where: { id: "org-fortinet" },
    update: {},
    create: {
      id: "org-fortinet",
      label: "Fortinet",
      websiteUrl: "https://www.fortinet.com",
      sortOrder: 0,
    },
  });

  const ciscoNetacad = await prisma.organization.upsert({
    where: { id: "org-cisco-netacad" },
    update: {},
    create: {
      id: "org-cisco-netacad",
      label: "Cisco Networking Academy",
      websiteUrl: "https://www.netacad.com",
      sortOrder: 1,
    },
  });

  const ossanAsur = await prisma.organization.upsert({
    where: { id: "org-ossanasur" },
    update: {},
    create: {
      id: "org-ossanasur",
      label: "OssanAsur",
      sortOrder: 2,
    },
  });

  const oracle = await prisma.organization.upsert({
    where: { id: "org-oracle" },
    update: {},
    create: {
      id: "org-oracle",
      label: "Oracle",
      websiteUrl: "https://www.oracle.com",
      sortOrder: 3,
    },
  });

  const meta = await prisma.organization.upsert({
    where: { id: "org-meta" },
    update: {},
    create: {
      id: "org-meta",
      label: "Meta",
      websiteUrl: "https://www.meta.com",
      sortOrder: 4,
    },
  });

  console.log("✔ Organizations seeded");

  // --- Technologies ---
  const techData = [
    { id: "tech-java", label: "Java", sortOrder: 0 },
    { id: "tech-spring-boot", label: "Spring Boot", sortOrder: 1 },
    { id: "tech-html", label: "HTML", sortOrder: 2 },
    { id: "tech-css", label: "CSS", sortOrder: 3 },
    { id: "tech-javascript", label: "JavaScript", sortOrder: 4 },
    { id: "tech-typescript", label: "TypeScript", sortOrder: 5 },
    { id: "tech-python", label: "Python", sortOrder: 6 },
    { id: "tech-flutter", label: "Flutter", sortOrder: 7 },
    { id: "tech-dart", label: "Dart", sortOrder: 8 },
    { id: "tech-angular", label: "Angular", sortOrder: 9 },
    { id: "tech-react", label: "React", sortOrder: 10 },
    { id: "tech-nextjs", label: "Next.js", sortOrder: 11 },
    { id: "tech-nestjs", label: "NestJS", sortOrder: 12 },
    { id: "tech-nodejs", label: "Node.js", sortOrder: 13 },
    { id: "tech-git", label: "Git", sortOrder: 14 },
    { id: "tech-github", label: "GitHub", sortOrder: 15 },
    { id: "tech-postgresql", label: "PostgreSQL", sortOrder: 16 },
    { id: "tech-mysql", label: "MySQL", sortOrder: 17 },
    { id: "tech-docker", label: "Docker", sortOrder: 18 },
    { id: "tech-tailwindcss", label: "Tailwind CSS", sortOrder: 19 },
    { id: "tech-prisma", label: "Prisma", sortOrder: 20 },
    { id: "tech-firebase", label: "Firebase", sortOrder: 21 },
    { id: "tech-linux", label: "Linux", sortOrder: 22 },
  ];

  for (const t of techData) {
    await prisma.technology.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }
  console.log("✔ Technologies seeded");

  // --- Presentations ---
  const presentationData = [
    {
      id: "pres-1",
      title: "Développeur d'Applications",
      subtitle: "Java Spring Boot | Flutter | Web",
      description:
        "Je conçois et développe des applications web et mobiles modernes, en mettant l'accent sur la qualité du code, la performance et l'expérience utilisateur.",
      sortOrder: 0,
    },
    {
      id: "pres-2",
      title: "Passionné par le Clean Code",
      subtitle: "Architecture logicielle & bonnes pratiques",
      description:
        "Adepte des principes SOLID, du design pattern et de l'architecture hexagonale pour construire des solutions maintenables et évolutives.",
      sortOrder: 1,
    },
  ];

  for (const p of presentationData) {
    await prisma.presentation.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log("✔ Presentations seeded");

  // --- Skills ---
  const skillData = [
    { id: "skill-java", technologyId: "tech-java", proficiency: 90, sortOrder: 0 },
    { id: "skill-spring-boot", technologyId: "tech-spring-boot", proficiency: 85, sortOrder: 1 },
    { id: "skill-html", technologyId: "tech-html", proficiency: 90, sortOrder: 2 },
    { id: "skill-css", technologyId: "tech-css", proficiency: 85, sortOrder: 3 },
    { id: "skill-javascript", technologyId: "tech-javascript", proficiency: 75, sortOrder: 4 },
    { id: "skill-typescript", technologyId: "tech-typescript", proficiency: 70, sortOrder: 5 },
    { id: "skill-python", technologyId: "tech-python", proficiency: 70, sortOrder: 6 },
    { id: "skill-flutter", technologyId: "tech-flutter", proficiency: 75, sortOrder: 7 },
    { id: "skill-angular", technologyId: "tech-angular", proficiency: 70, sortOrder: 8 },
    { id: "skill-react", technologyId: "tech-react", proficiency: 65, sortOrder: 9 },
    { id: "skill-nextjs", technologyId: "tech-nextjs", proficiency: 65, sortOrder: 10 },
    { id: "skill-nestjs", technologyId: "tech-nestjs", proficiency: 65, sortOrder: 11 },
    { id: "skill-git", technologyId: "tech-git", proficiency: 85, sortOrder: 12 },
    { id: "skill-postgresql", technologyId: "tech-postgresql", proficiency: 75, sortOrder: 13 },
    { id: "skill-docker", technologyId: "tech-docker", proficiency: 60, sortOrder: 14 },
    { id: "skill-linux", technologyId: "tech-linux", proficiency: 70, sortOrder: 15 },
  ];

  for (const s of skillData) {
    await prisma.skill.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }
  console.log("✔ Skills seeded");

  // --- Experience ---
  const experienceData = [
    {
      id: "exp-ossanasur",
      company: "OssanAsur",
      role: "Développeur d'applications (Stagiaire)",
      description:
        "Développement d'applications web et mobiles pour des clients variés. Travail en équipe Agile sur des projets fullstack avec Spring Boot, Angular et Flutter.",
      startDate: new Date("2025-07-01"),
      endDate: null,
      isCurrent: true,
      sortOrder: 0,
    },
  ];

  for (const e of experienceData) {
    await prisma.experience.upsert({
      where: { id: e.id },
      update: {},
      create: e,
    });
  }
  console.log("✔ Experiences seeded");

  // --- Certifications ---
  const certificationData = [
    {
      id: "cert-nse1",
      name: "NSE 1 - Network Security Associate",
      organizationId: fortinet.id,
      description: "Certification en sécurité réseau couvrant les fondamentaux du paysage des menaces et de la cybersécurité.",
      sortOrder: 0,
    },
    {
      id: "cert-nse2",
      name: "NSE 2 - Network Security Associate",
      organizationId: fortinet.id,
      description: "Certification couvrant les types de produits de sécurité : pare-feu, sandboxing, sécurité des endpoints et contrôle d'accès réseau.",
      sortOrder: 1,
    },
    {
      id: "cert-python-essentials",
      name: "Python Essentials",
      organizationId: ciscoNetacad.id,
      description: "Certification couvrant les fondamentaux de la programmation Python : types de données, structures de contrôle, fonctions et manipulation de données.",
      sortOrder: 2,
    },
    {
      id: "cert-java-foundations",
      name: "Java Foundations",
      organizationId: oracle.id,
      description: "Certification couvrant les bases de la programmation Java : syntaxe, POO, collections et gestion des exceptions.",
      sortOrder: 3,
    },
    {
      id: "cert-intro-cybersecurity",
      name: "Introduction to Cybersecurity",
      organizationId: ciscoNetacad.id,
      description: "Certification d'introduction aux concepts fondamentaux de la cybersécurité et de la protection des données.",
      sortOrder: 4,
    },
  ];

  for (const c of certificationData) {
    await prisma.certification.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log("✔ Certifications seeded");

  // --- Projects ---
  const projectData = [
    {
      id: "proj-agble",
      name: "AGBLE",
      description:
        "Application de gestion et de structuration de l'espace agricole. Solution mobile permettant aux agriculteurs de gérer leurs parcelles, suivre leurs cultures et optimiser leur production.",
      targetAudience: "Agriculteurs, Coopératives agricoles, ONG",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2024-09-15"),
      sortOrder: 0,
      techIds: ["tech-flutter", "tech-dart", "tech-firebase", "tech-git", "tech-github"],
    },
    {
      id: "proj-dumevi-gbale",
      name: "Dumevi-Gbalè",
      description:
        "Application de gestion des mairies. Plateforme web complète permettant la gestion administrative des collectivités locales : état civil, gestion des documents, suivi des demandes citoyennes.",
      targetAudience: "Mairies, Collectivités locales, Citoyens",
      startDate: new Date("2024-10-01"),
      endDate: new Date("2025-03-30"),
      sortOrder: 1,
      techIds: ["tech-spring-boot", "tech-java", "tech-angular", "tech-typescript", "tech-postgresql", "tech-git", "tech-github"],
    },
    {
      id: "proj-portfolio",
      name: "Portfolio Personnel",
      description:
        "Site portfolio full-stack avec un backoffice d'administration complet. Toutes les données sont configurables dynamiquement depuis l'interface admin.",
      targetAudience: "Recruteurs, Clients, Développeurs",
      startDate: new Date("2025-12-01"),
      endDate: null,
      sortOrder: 2,
      techIds: ["tech-nextjs", "tech-nestjs", "tech-typescript", "tech-prisma", "tech-postgresql", "tech-tailwindcss", "tech-git"],
    },
  ];

  for (const p of projectData) {
    const { techIds, ...projectFields } = p;
    await prisma.project.upsert({
      where: { id: p.id },
      update: {},
      create: projectFields,
    });

    for (const techId of techIds) {
      await prisma.projectTechnology.upsert({
        where: {
          projectId_technologyId: { projectId: p.id, technologyId: techId },
        },
        update: {},
        create: { projectId: p.id, technologyId: techId },
      });
    }
  }

  // --- Project Collaborators ---
  const collaboratorData = [
    {
      id: "collab-1",
      projectId: "proj-agble",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@example.com",
      sortOrder: 0,
    },
    {
      id: "collab-2",
      projectId: "proj-agble",
      firstName: "Marie",
      lastName: "Koffi",
      linkedinUrl: "https://linkedin.com/in/marie-koffi",
      sortOrder: 1,
    },
    {
      id: "collab-3",
      projectId: "proj-dumevi-gbale",
      firstName: "Kofi",
      lastName: "Mensah",
      email: "kofi.mensah@example.com",
      linkedinUrl: "https://linkedin.com/in/kofi-mensah",
      sortOrder: 0,
    },
  ];

  for (const c of collaboratorData) {
    await prisma.projectCollaborator.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  console.log("✔ Projects seeded");

  // --- Services ---
  const serviceData = [
    {
      id: "svc-web-dev",
      label: "Développement Web",
      description:
        "Conception et développement d'applications web modernes avec Spring Boot, Angular, React ou Next.js. APIs REST, architecture microservices, déploiement.",
      organizationId: ossanAsur.id,
      sortOrder: 0,
    },
    {
      id: "svc-mobile-dev",
      label: "Développement Mobile",
      description:
        "Création d'applications mobiles cross-platform avec Flutter. Interface utilisateur soignée, performances natives, intégration d'APIs.",
      organizationId: ossanAsur.id,
      sortOrder: 1,
    },
    {
      id: "svc-backend-api",
      label: "Backend & API",
      description:
        "Développement d'APIs robustes et sécurisées avec Java Spring Boot ou NestJS. Base de données PostgreSQL, authentification, documentation Swagger.",
      sortOrder: 2,
    },
    {
      id: "svc-consulting",
      label: "Conseil & Architecture",
      description:
        "Accompagnement sur le choix des technologies, l'architecture logicielle et les bonnes pratiques de développement.",
      sortOrder: 3,
    },
  ];

  for (const s of serviceData) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }
  console.log("✔ Services seeded");

  // --- About ---
  const aboutData = [
    {
      id: "about-1",
      content:
        "Passionné par le développement logiciel depuis mes études, je me spécialise dans la création d'applications web et mobiles robustes. Mon parcours m'a permis de maîtriser l'écosystème Java/Spring Boot ainsi que les technologies web modernes.",
      sortOrder: 0,
    },
    {
      id: "about-2",
      content:
        "Actuellement en stage chez OssanAsur, je travaille au quotidien sur des projets concrets qui me permettent d'affiner mes compétences en architecture logicielle, développement fullstack et travail en équipe Agile.",
      sortOrder: 1,
    },
    {
      id: "about-3",
      content:
        "Je suis convaincu que la qualité du code et l'attention portée à l'expérience utilisateur sont les piliers d'un logiciel réussi. Je m'efforce d'appliquer les bonnes pratiques (SOLID, Clean Architecture, tests) dans chacun de mes projets.",
      sortOrder: 2,
    },
  ];

  for (const a of aboutData) {
    await prisma.about.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }
  console.log("✔ About seeded");

  // --- Contact Messages ---
  const contactMessageData = [
    {
      id: "msg-1",
      firstName: "Alice",
      lastName: "Martin",
      email: "alice.martin@example.com",
      subject: "Collaboration possible",
      message:
        "Bonjour, je suis intéressée par vos services de développement web. Pourriez-vous me contacter ?",
      isRead: true,
    },
    {
      id: "msg-2",
      firstName: "Thomas",
      lastName: "Dubois",
      email: "thomas.dubois@example.com",
      subject: "Demande de devis",
      message:
        "Bonjour, j'aurais besoin d'une application mobile pour mon entreprise. Pourriez-vous me faire un devis ?",
      isRead: false,
    },
    {
      id: "msg-3",
      firstName: "Sophie",
      lastName: "Bernard",
      email: "sophie.b@example.com",
      subject: "Stage",
      message:
        "Bonjour, je suis étudiante en informatique et je cherche un stage. Votre profil m'intéresse beaucoup.",
      isRead: false,
    },
  ];

  for (const m of contactMessageData) {
    await prisma.contactMessage.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    });
  }
  console.log("✔ Contact Messages seeded");

  // --- Testimonials ---
  const testimonialData = [
    {
      id: "testimonial-1",
      firstName: "Pierre",
      lastName: "Akakpo",
      company: "OssanAsur",
      role: "Chef de projet",
      content:
        "Fanuel est un développeur très compétent et rigoureux. Son travail sur nos projets Spring Boot a été remarquable.",
      isApproved: true,
      sortOrder: 0,
    },
    {
      id: "testimonial-2",
      firstName: "Amina",
      lastName: "Traoré",
      company: "AgriTech Togo",
      role: "Directrice",
      content:
        "L'application AGBLE a transformé la gestion de nos coopératives agricoles. Un travail de qualité !",
      isApproved: true,
      sortOrder: 1,
    },
    {
      id: "testimonial-3",
      firstName: "Marc",
      lastName: "Kouassi",
      content:
        "Très bon développeur, je recommande vivement ses services.",
      isApproved: false,
      sortOrder: 2,
    },
  ];

  for (const t of testimonialData) {
    await prisma.testimonial.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }
  console.log("✔ Testimonials seeded");

  // --- Admin User ---
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.upsert({
    where: { id: "admin-1" },
    update: {},
    create: {
      id: "admin-1",
      email: "benyofanuel@gmail.com",
      passwordHash,
    },
  });
  console.log("✔ Admin User seeded (email: benyofanuel@gmail.com, password: admin123)");

  // --- Blog Posts ---
  const blogPostData = [
    {
      id: "blog-1",
      title: "Pourquoi j'ai choisi Spring Boot pour mes projets backend",
      slug: "pourquoi-spring-boot",
      content: `# Pourquoi Spring Boot ?\n\nSpring Boot est mon framework backend de prédilection. Voici pourquoi.\n\n## Productivité\n\nAvec Spring Boot, je peux démarrer un projet en quelques minutes grâce à Spring Initializr et l'auto-configuration.\n\n## Écosystème riche\n\n- Spring Security pour l'authentification\n- Spring Data JPA pour la persistance\n- Spring Cloud pour les microservices\n\n## Performance\n\nLe framework offre d'excellentes performances out-of-the-box avec un serveur embarqué optimisé.\n\n## Conclusion\n\nSi vous cherchez un framework robuste et mature pour vos APIs, Spring Boot reste un excellent choix.`,
      excerpt: "Découvrez pourquoi Spring Boot est mon choix privilégié pour le développement backend.",
      isPublished: true,
      publishedAt: new Date("2025-11-15"),
      sortOrder: 0,
    },
    {
      id: "blog-2",
      title: "Flutter vs React Native : mon retour d'expérience",
      slug: "flutter-vs-react-native",
      content: `# Flutter vs React Native\n\nAprès avoir travaillé avec les deux frameworks, voici mon analyse comparative.\n\n## Flutter\n\n**Avantages :**\n- Performance native grâce au moteur Skia\n- Hot reload ultra-rapide\n- Un seul langage (Dart) pour tout\n\n**Inconvénients :**\n- Dart est moins populaire\n- Taille des applications plus grande\n\n## React Native\n\n**Avantages :**\n- JavaScript/TypeScript (large communauté)\n- Accès direct aux modules natifs\n\n**Inconvénients :**\n- Bridge JavaScript-natif = overhead\n- Moins de widgets built-in\n\n## Mon choix\n\nPour mes projets actuels, je préfère **Flutter** pour sa consistance UI et ses performances.`,
      excerpt: "Comparaison détaillée entre Flutter et React Native après plusieurs projets avec chaque technologie.",
      isPublished: true,
      publishedAt: new Date("2025-12-20"),
      sortOrder: 1,
    },
    {
      id: "blog-3",
      title: "Architecture hexagonale en pratique",
      slug: "architecture-hexagonale",
      content: `# Architecture Hexagonale\n\nL'architecture hexagonale (ports & adapters) est un pattern que j'applique systématiquement.\n\n## Le principe\n\nSéparer le domaine métier de l'infrastructure technique.\n\n## En pratique\n\nCe brouillon sera complété prochainement...`,
      excerpt: "Comment j'applique l'architecture hexagonale dans mes projets Java.",
      isPublished: false,
      sortOrder: 2,
    },
  ];

  for (const b of blogPostData) {
    await prisma.blogPost.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }
  console.log("✔ Blog Posts seeded");

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
