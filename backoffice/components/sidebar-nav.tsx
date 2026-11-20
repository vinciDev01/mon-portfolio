"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Briefcase01Icon,
  Building03Icon,
  Certificate01Icon,
  CodeIcon,
  CustomerService01Icon,
  DashboardSquare01Icon,
  FileEditIcon,
  Files01Icon,
  Folder01Icon,
  Idea01Icon,
  InformationCircleIcon,
  Layers01Icon,
  LicenseDraftIcon,
  Logout01Icon,
  Mail01Icon,
  Mortarboard01Icon,
  News01Icon,
  Presentation01Icon,
  QuoteUpIcon,
  Rocket01Icon,
  Setting07Icon,
  SidebarLeft01Icon,
  SidebarRight01Icon,
  Tag01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { removeToken } from "@/lib/auth";
import { ConfirmDialog } from "@/components/confirm-dialog";

type Item = { href: string; label: string; icone: IconSvgElement };

const avantSections: Item[] = [
  { href: "/", label: "Tableau de bord", icone: DashboardSquare01Icon },
  { href: "/site-settings", label: "Paramètres du site", icone: Setting07Icon },
  { href: "/personal-info", label: "Informations personnelles", icone: UserIcon },
];

/** Les pages qui remplissent une section du portfolio, regroupees sous un
 *  seul titre deroulable. */
const sections: Item[] = [
  { href: "/presentations", label: "Présentations", icone: Presentation01Icon },
  { href: "/skills", label: "Compétences", icone: Idea01Icon },
  { href: "/experiences", label: "Expériences", icone: Briefcase01Icon },
  { href: "/certifications", label: "Certifications", icone: Certificate01Icon },
  { href: "/cours", label: "Cours", icone: Mortarboard01Icon },
  { href: "/projects", label: "Projets", icone: Rocket01Icon },
  { href: "/services", label: "Services", icone: CustomerService01Icon },
  { href: "/about", label: "À propos", icone: InformationCircleIcon },
  { href: "/testimonials", label: "Témoignages", icone: QuoteUpIcon },
];

const apresSections: Item[] = [
  { href: "/technologies", label: "Technologies", icone: CodeIcon },
  { href: "/technology-families", label: "Familles de technologies", icone: Layers01Icon },
  { href: "/organizations", label: "Organisations", icone: Building03Icon },
  { href: "/contact-messages", label: "Messages de contact", icone: Mail01Icon },
  { href: "/cv-sections", label: "Sections du CV", icone: LicenseDraftIcon },
  { href: "/cv-versions", label: "Versions du CV", icone: Files01Icon },
  { href: "/lettres", label: "Lettres de motivation", icone: FileEditIcon },
  { href: "/blog", label: "Blog", icone: News01Icon },
  { href: "/blog-categories", label: "Catégories du blog", icone: Tag01Icon },
];

/** Le choix « menu replie », garde d'une visite a l'autre dans ce navigateur. */
const CLE_REPLIE = "backoffice-menu-replie";

// Le choix est lu dans le stockage du navigateur comme une source externe :
// le serveur rend le menu deplie, le client prend ensuite le choix garde.
const abonnes = new Set<() => void>();
function sAbonner(rappel: () => void) {
  abonnes.add(rappel);
  return () => abonnes.delete(rappel);
}
function lireReplie(): boolean {
  try {
    return localStorage.getItem(CLE_REPLIE) === "1";
  } catch {
    return false;
  }
}
function ecrireReplie(valeur: boolean) {
  try {
    localStorage.setItem(CLE_REPLIE, valeur ? "1" : "0");
  } catch {
    // Stockage indisponible : le choix ne sera pas retenu.
  }
  abonnes.forEach((rappel) => rappel());
}

function estActif(href: string, pathname: string): boolean {
  // Adresse exacte ou suivie d'un « / » : un simple prefixe marquerait aussi
  // « Blog » actif sur « /blog-categories ».
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Icone({ icone }: { icone: IconSvgElement }) {
  return <HugeiconsIcon icon={icone} size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />;
}

function Lien({
  item,
  pathname,
  retrait = false,
  replie,
}: {
  item: Item;
  pathname: string;
  retrait?: boolean;
  replie: boolean;
}) {
  const actif = estActif(item.href, pathname);
  return (
    <Link
      href={item.href}
      aria-current={actif ? "page" : undefined}
      // Replie, le libelle reste lu par les lecteurs d'ecran et s'affiche au survol.
      title={replie ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        retrait && !replie && "pl-6",
        replie && "justify-center px-0",
        actif ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
      )}
    >
      <Icone icone={item.icone} />
      <span className={cn("truncate", replie && "sr-only")}>{item.label}</span>
    </Link>
  );
}

/**
 * Le menu du backoffice : une icone devant chaque page, et un bouton qui le
 * replie en une colonne d'icones pour laisser la place au contenu (editeur et
 * apercu cote a cote, par exemple).
 */
export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  // Ferme par defaut, sauf si la page ouverte en fait partie : l'entree active
  // doit rester visible.
  const [sectionsOuvertes, setSectionsOuvertes] = useState(() =>
    sections.some((s) => estActif(s.href, pathname)),
  );
  const replie = useSyncExternalStore(sAbonner, lireReplie, () => false);
  const basculerReplie = () => ecrireReplie(!replie);

  // La deconnexion demande confirmation : un clic de travers, en bas du
  // menu, ferait perdre une saisie en cours.
  const [confirmerSortie, setConfirmerSortie] = useState(false);

  function handleLogout() {
    removeToken();
    router.replace("/login");
  }

  return (
    // Hauteur de l'ecran, et collee en haut : la barre ne s'etire plus avec
    // une page longue, et la deconnexion reste visible en bas sans defiler.
    // Seule la liste du menu defile si elle depasse.
    <aside
      className={cn(
        "h-screen sticky top-0 shrink-0 border-r border-border bg-card p-3 flex flex-col gap-1 transition-[width] duration-200",
        replie ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex items-center gap-2 py-3 mb-3", replie ? "justify-center" : "justify-between px-3")}>
        {!replie && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">Portfolio Admin</h1>
            <p className="text-xs text-muted-foreground">Backoffice</p>
          </div>
        )}
        <button
          type="button"
          onClick={basculerReplie}
          aria-label={replie ? "Déplier le menu" : "Replier le menu"}
          title={replie ? "Déplier le menu" : "Replier le menu"}
          className="p-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Icone icone={replie ? SidebarRight01Icon : SidebarLeft01Icon} />
        </button>
      </div>
      <nav className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        {avantSections.map((item) => (
          <Lien key={item.href} item={item} pathname={pathname} replie={replie} />
        ))}
        <button
          type="button"
          onClick={() => setSectionsOuvertes((o) => !o)}
          aria-expanded={sectionsOuvertes}
          aria-controls="nav-sections"
          title={replie ? "Sections" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left text-foreground hover:bg-accent transition-colors cursor-pointer",
            replie && "justify-center px-0",
          )}
        >
          <Icone icone={Folder01Icon} />
          <span className={cn("flex-1", replie && "sr-only")}>Sections</span>
          {!replie && (
            <span className={cn("inline-flex transition-transform", sectionsOuvertes && "rotate-90")} aria-hidden="true">
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </span>
          )}
        </button>
        <div
          id="nav-sections"
          hidden={!sectionsOuvertes}
          // Replie, un filet distingue les pages du groupe ouvert.
          className={cn("flex flex-col gap-1", replie && "border-y border-border py-1")}
        >
          {sections.map((item) => (
            <Lien key={item.href} item={item} pathname={pathname} retrait replie={replie} />
          ))}
        </div>
        {apresSections.map((item) => (
          <Lien key={item.href} item={item} pathname={pathname} replie={replie} />
        ))}
      </nav>
      <div className="mt-3 pt-3 border-t border-border">
        <button
          onClick={() => setConfirmerSortie(true)}
          title={replie ? "Déconnexion" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left text-destructive hover:bg-destructive/10 transition-colors",
            replie && "justify-center px-0",
          )}
        >
          <Icone icone={Logout01Icon} />
          <span className={cn(replie && "sr-only")}>Déconnexion</span>
        </button>
      </div>
      <ConfirmDialog
        open={confirmerSortie}
        title="Se déconnecter ?"
        message="Vous devrez vous reconnecter pour revenir au backoffice. Les modifications non enregistrées seront perdues."
        confirmLabel="Se déconnecter"
        onConfirm={() => {
          setConfirmerSortie(false);
          handleLogout();
        }}
        onCancel={() => setConfirmerSortie(false)}
      />
    </aside>
  );
}
