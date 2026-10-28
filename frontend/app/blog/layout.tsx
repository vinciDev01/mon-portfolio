import { Ampoule } from "@/components/ampoule/ampoule";
import { ColonnePassage } from "@/components/parcours/colonne-passage";
import { FournisseurSectionActive } from "@/components/parcours/parcours-pagine";
import { getPortfolioData } from "@/lib/api";

/** Les pages du blog gardent l'ampoule, en haut a droite comme sur le
 *  portfolio : le theme se bascule de partout. Elles portent aussi la colonne
 *  de navigation : sans section a designer ici, ses entrees ramenent a celles
 *  du portfolio, et l'entree « Blog » de son pied marque la page courante. Si
 *  les donnees du portfolio manquent, le blog s'affiche sans elle. */
export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const data = await getPortfolioData().catch(() => null);

  return (
    <FournisseurSectionActive initial={null}>
      <Ampoule />
      {data && <ColonnePassage reglages={data.siteSettings} infos={data.personalInfo} racine="/" page="blog" />}
      <main className={`min-h-screen${data ? " gouttiere-parcours" : ""}`}>
        <div className="mx-auto max-w-5xl px-8 md:px-12 py-16">{children}</div>
      </main>
    </FournisseurSectionActive>
  );
}
