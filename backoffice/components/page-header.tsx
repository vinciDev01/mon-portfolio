import Link from "next/link";

interface PageHeaderProps {
  title: string;
  addHref?: string;
  addLabel?: string;
}

export function PageHeader({ title, addHref, addLabel = "Ajouter" }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      {addHref && (
        <Link
          href={addHref}
          className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {addLabel}
        </Link>
      )}
    </div>
  );
}
