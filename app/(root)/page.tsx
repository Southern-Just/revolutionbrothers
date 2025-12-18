"use client";
import HeroCarousel from "@/components/HeroCarousel";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // attach auth logic here
    console.log({ email, password });
    router.push("/revolution");
  }

  return (
    <main className="min-h-screen">
      <HeroCarousel />

      <div className="relative z-10 -mt-32 mx-auto w-[90%] max-w-6xl">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-16 text-center min-h-[60vh] flex flex-col">

          {/* TEXT */}
          <div className="grow">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Not Yet Uhuru
            </h1>
            <p className="text-brand text-lg md:text-xl">
              Our future is ours to shape; Redefine the financial G-A-M-E with us
            </p>
          </div>

          {/* ACTION AREA */}
          <div className="mt-auto mb-12 flex justify-center">
            {!showAuth ? (
              <button
                className="cursor-pointer bg-white text-black hover:bg-gray-100 font-semibold py-4 px-10 rounded-full text-lg transition shadow-lg border-t border-gray-300 shadow-gray-400"
                onClick={() => setShowAuth(true)}
              >
                Get Started
              </button>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm flex flex-col gap-4"
              >
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-base"
                />

                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3 text-base"
                />

                <button
                  type="submit"
                  className="bg-black text-white font-semibold py-4 rounded-full text-lg"
                >
                  Continue
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
