import { Ampoule } from "@/components/ampoule/ampoule";

/** Les pages du blog gardent l'ampoule, en haut a droite comme sur le
 *  portfolio : le theme se bascule de partout. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Ampoule />
      <div className="mx-auto px-8 md:px-20 lg:px-40 xl:px-52 py-16">
        {children}
      </div>
    </div>
  );
}
