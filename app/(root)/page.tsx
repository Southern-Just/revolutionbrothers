"use client";
import Header from "@/components/Header";
import HeroCarousel from "@/components/HeroCarousel";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <main className="min-h-screen">
      <HeroCarousel />
      <div className="relative z-10 -mt-32 mx-auto w-[90%] max-w-6xl">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-16 text-center h-[calc(100vh-60vh+6rem)] min-h-100 flex flex-col">
          <div className="grow">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Not Yet Uhuru</h1>
            <p className="text-brand text-lg md:text-xl">
              Our future is us and ours; we define our financial standing
            </p>
          </div>
          <div className="mt-auto mb-12">
            <button className="cursor-pointer bg-white text-black hover:bg-gray-100 font-semibold py-4 px-10 rounded-full text-lg transition shadow-lg border-t border-gray-300 shadow-gray-400" 
            onClick={()=>{router.push("/revolution")}}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}