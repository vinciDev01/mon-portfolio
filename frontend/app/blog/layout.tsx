export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto px-8 md:px-20 lg:px-40 xl:px-52 py-16">
        {children}
      </div>
    </div>
  );
}
