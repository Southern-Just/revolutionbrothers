"use client";

import HeroCarousel from "@/components/HeroCarousel";
import { signIn, signUp } from "@/lib/actions/user.actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function Hero() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);

  const authMode = searchParams.get("auth");
  const isSignUp = authMode === "signup";
  const showAuth = authMode === "signin" || isSignUp;

  useEffect(() => {
    if (!showAuth && authMode) router.replace("/", { scroll: false });
  }, [authMode, router, showAuth]);

  useEffect(() => {
    const checkAccess = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Define "mobile portrait": width <= 768px and height > width (portrait orientation)
      // Adjust 768px if you want stricter (e.g., 480px) or looser limits
      setIsAllowed(width <= 768 && height > width);
    };

    // Check on mount
    checkAccess();

    // Re-check on window resize (e.g., rotating device or resizing browser)
    window.addEventListener('resize', checkAccess);

    // Cleanup
    return () => window.removeEventListener('resize', checkAccess);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp({ email: email.trim().toLowerCase(), password, pin });
        setEmail("");
        setPassword("");
        setPin("");
        router.push("/revolution");
      } else {
        await signIn({ email: email.trim().toLowerCase(), password });
        router.push("/revolution");
      }
    } catch (err) {
      if (err instanceof Error) {
        switch (err.message) {
          case "INVALID_CREDENTIALS":
            setError("Invalid email or password");
            break;
          case "USER_EXISTS":
            setError("User already exists");
            break;
          case "INVALID_PIN":
            setError("Invalid PIN");
            break;
          default:
            setError("Something went wrong");
        }
      } else {
        setError("An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => router.push("/?auth=signin", { scroll: false });
  const handleToggleSignUp = () =>
    router.push(`/?auth=${isSignUp ? "signin" : "signup"}`, { scroll: false });

  if (!isAllowed) {
    return (
      <div className="flex flex-col min-h-screen w-full p-20">
        <div className="flex flex-col justify-center items-center align-middle text-center space-y-6 flex-grow">
          <p className="text-brand text-4xl"> Sorry G 😢</p>
          <div className="text-brand grid grid-cols-[max-content_auto] gap-1">
            <span>Either you are on:</span>
            <div className="text-xs flex flex-col text-gray-500 px-2 py-1 space-y-3 text-start border border-brand">
              <span>A device larger than a mobile screen</span>
              <span className="ml-10">or</span>
              <span>your device is in landscape mode</span>
            </div>
          </div>
          <p className="text-xs ml-16">Please use a <span className="text-xl text-red-200">*</span>mobile screen and portrait mode only</p>
                    <p className="text-[9px] ml-42"> Thanks for understanding, Tutashugulikia</p>

        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <HeroCarousel />
      <div className="relative z-10 -mt-39 md:-mt-69 mx-auto w-[90%] max-w-6xl">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-16 text-center min-h-[56vh] flex flex-col">
          <div className="grow">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Not Yet Uhuru</h1>
            <p className="text-brand text-lg md:text-xl">
              Our future is ours to shape; Redefine the financial G-A-M-E with us
            </p>
          </div>

          <div className="mt-auto mb-12 flex justify-center flex-col items-center gap-4">
            {!showAuth ? (
              <button
                disabled={loading}
                onClick={handleGetStarted}
                className="cursor-pointer bg-white text-black hover:bg-gray-100 font-semibold py-4 px-10 rounded-full text-lg transition shadow-lg border-t border-gray-300 shadow-gray-400"
              >
                Get Started
              </button>
            ) : (
              <div className="w-full max-w-sm mt-4">
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
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
                        onChange={(e) =>
                          setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        className="w-20 rounded-xl border px-2 py-3 text-sm text-center"
                      />
                    )}
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <label className="flex items-center gap-1 cursor-pointer text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={isSignUp}
                      onChange={handleToggleSignUp}
                      className="accent-brand"
                    />
                    Sign Up
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white font-semibold py-4 rounded-full text-lg"
                  >
                    {loading ? "In a Sec. ..." : isSignUp ? "Système Join⁺" : "Con·ti·nue"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}