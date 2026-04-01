import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionWrapper({
  id,
  title,
  children,
  className,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 px-8 md:px-20 lg:px-40 xl:px-52 section-separator",
        className,
      )}
    >
      <h2 className="text-2xl font-semibold mb-8 tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
