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
        "py-16 px-6 md:px-12 lg:px-24 section-separator",
        className,
      )}
    >
      <h2 className="text-2xl font-semibold mb-8 tracking-tight">{title}</h2>
      {children}
    </section>
  );
}
