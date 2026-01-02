import HeroCarousel from "@/components/HeroCarousel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <HeroCarousel />
      <div className="relative z-10 -mt-39 md:-mt-69 mx-auto w-[90%] max-w-6xl">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-16 text-center min-h-[56vh] flex flex-col">
          {children}
        </div>
      </div>
    </main>
  );
}
