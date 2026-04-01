import Link from "next/link";

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
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tableau de bord</h1>
      <p className="text-muted-foreground mb-8">
        Gérez le contenu de votre portfolio depuis cet espace.
      </p>
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
