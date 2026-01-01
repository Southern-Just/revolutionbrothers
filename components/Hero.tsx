"use client";

import HeroCarousel from "@/components/HeroCarousel";
import { signIn, signUp, resetPassword } from "@/lib/actions/user.actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";

export default function Hero() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotPin, setForgotPin] = useState("");
  const [showForgotPasswordVisibility, setShowForgotPasswordVisibility] =
    useState(false);

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
      setIsAllowed(width <= 768 && height > width);
    };

    checkAccess();
    window.addEventListener("resize", checkAccess);
    return () => window.removeEventListener("resize", checkAccess);
  }, []);

  useEffect(() => {
    if (isAllowed && showBlock) {
      setAnimatingOut(true);
      setTimeout(() => {
        setShowBlock(false);
        setAnimatingOut(false);
      }, 500);
    } else if (!isAllowed) {
      setShowBlock(true);
      setAnimatingOut(false);
    }
  }, [isAllowed, showBlock]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await signUp({ email: email.trim().toLowerCase(), password, pin });
        toast.success("Account created");
        setEmail("");
        setPassword("");
        setPin("");
        router.push("/revolution");
      } else {
        await signIn({ email: email.trim().toLowerCase(), password });
        toast.success("Welcome back");
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

  const handleForgotPasswordSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        pin: forgotPin,
        newPassword: forgotPassword,
      });

      toast.success("Password updated");
      setShowForgotPassword(false);
      setForgotPassword("");
      setForgotPin("");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "INVALID_PIN") {
          setError("Invalid PIN");
        } else if (err.message === "USER_NOT_FOUND") {
          setError("User not found");
        } else {
          setError("Failed to reset password");
        }
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () =>
    router.push("/?auth=signin", { scroll: false });

  const handleToggleSignUp = () =>
    router.push(`/?auth=${isSignUp ? "signin" : "signup"}`, {
      scroll: false,
    });

  return (
    <>
      {showBlock && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
            animatingOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col justify-center items-center text-center space-y-6">
              <p className="text-gray-500 text-3xl font-semibold">Sorry G 😢</p>
              <div className="text-brand grid grid-cols-[max-content_auto] gap-1">
                <span>Either you are on:</span>
                <div className="text-xs flex flex-col text-gray-500 px-2 py-1 space-y-3 text-start border border-brand">
                  <span>A device larger than a mobile screen</span>
                  <span className="ml-10">or</span>
                  <span>your device is in landscape mode</span>
                </div>
              </div>
              <div className="space-y-4 pr-18">
                <p className="text-xs">
                  Please use a <span className="text-xl text-red-200">*</span>
                  mobile screen and portrait mode only
                </p>
                <p className="text-[9px] text-brand text-end">
                  Thanks for understanding, Tutashugulikia
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Forgot Password</h2>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="text-gray-500"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleForgotPasswordSubmit}
              className="flex flex-col gap-4"
            >
              <input
                type="email"
                value={email}
                readOnly
                className="w-full rounded-xl border px-4 py-3 bg-gray-100"
              />
              <input
                type="text"
                maxLength={4}
                value={forgotPin}
                onChange={(e) =>
                  setForgotPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="PIN"
                className="w-full rounded-xl border px-4 py-3"
              />
              <div className="relative">
                <input
                  type={showForgotPasswordVisibility ? "text" : "password"}
                  value={forgotPassword}
                  onChange={(e) => setForgotPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full rounded-xl border px-4 py-3 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordVisibility((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Image
                    src={
                      showForgotPasswordVisibility
                        ? "/icons/eye-off.svg"
                        : "/icons/eye.svg"
                    }
                    width={20}
                    height={20}
                    alt="toggle password"
                    className="opacity-40"
                  />
                </button>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white font-semibold py-4 rounded-full text-lg"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      <main
        className={`min-h-screen transition-opacity duration-500 ease-in-out ${
          showBlock && !animatingOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <HeroCarousel />
        <div className="relative z-10 -mt-39 md:-mt-69 mx-auto w-[90%] max-w-6xl">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-16 text-center min-h-[56vh] flex flex-col">
            <div className="grow">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Not Yet Uhuru
              </h1>
              <p className="text-brand text-lg md:text-xl">
                Our future is ours to shape; Redefine the financial G-A-M-E with
                us
              </p>
            </div>

            <div className="mt-auto mb-12 flex flex-col items-center gap-4">
              {!showAuth ? (
                <button
                  disabled={loading}
                  onClick={handleGetStarted}
                  className="bg-white text-black font-semibold py-4 px-10 rounded-full text-lg shadow-lg"
                >
                  Get Started
                </button>
              ) : (
                <div className="w-full max-w-sm mt-4">
                  <form
                    onSubmit={handleSubmit}
                    className="w-full flex flex-col gap-4"
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-xl border px-4 py-3"
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full rounded-xl border px-4 py-3 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <Image
                            src={
                              showPassword
                                ? "/icons/eye-off.svg"
                                : "/icons/eye.svg"
                            }
                            width={20}
                            height={20}
                            alt="toggle password"
                            className="opacity-40"
                          />
                        </button>
                      </div>
                      {isSignUp && (
                        <input
                          type="text"
                          maxLength={4}
                          value={pin}
                          onChange={(e) =>
                            setPin(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="PIN"
                          className="w-20 rounded-xl border px-2 py-3 text-center"
                        />
                      )}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1 text-sm text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSignUp}
                          onChange={handleToggleSignUp}
                        />
                        Sign Up
                      </label>
                      <span
                        className="text-sm text-gray-500 cursor-pointer"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot Password?
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-black text-white font-semibold py-4 rounded-full text-lg"
                    >
                      {loading
                        ? "In a Sec. ..."
                        : isSignUp
                        ? "Système Join⁺"
                        : "Con·ti·nue"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
