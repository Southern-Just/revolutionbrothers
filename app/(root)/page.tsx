"use client";
import HeroCarousel from "@/components/HeroCarousel";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log({ email, password, pin, isSignUp });
    router.push("/revolution");
  }

  return (
    <main className="min-h-screen">
      <HeroCarousel />

      <div className="relative z-10 -mt-32 mx-auto w-[90%] max-w-6xl">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-16 text-center min-h-[60vh] flex flex-col">
          <div className="grow">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Not Yet Uhuru
            </h1>
            <p className="text-brand text-lg md:text-xl">
              Our future is ours to shape; Redefine the financial G-A-M-E with us
            </p>
          </div>

          <div className="mt-auto mb-12 flex justify-center flex-col items-center gap-4">
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

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 w-40 rounded-xl border px-4 py-3 text-base"
                  />
                  {isSignUp && (
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/, ""))}
                      className="w-20 rounded-xl border px-2 py-3 text-sm text-center"
                    />
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSignUp}
                      onChange={(e) => setIsSignUp(e.target.checked)}
                      className="accent-brand"
                    />
                    Sign Up
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-black text-white font-semibold py-4 rounded-full text-lg"
                >
                  {isSignUp ? "Join Us" : "Continue"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
