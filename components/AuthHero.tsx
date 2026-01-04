"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  signIn,
  signUp,
  resetPassword,
} from "@/lib/actions/user.actions";

type AuthMode = "sign-in" | "sign-up";

type AuthHeroProps = {
  mode: AuthMode;
};

type ViewMode = "auth" | "forgot";

export default function AuthHero({ mode }: AuthHeroProps) {
  const router = useRouter();
  const isSignIn = mode === "sign-in";

  const [view, setView] = useState<ViewMode>("auth");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotPin, setForgotPin] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordVisibility, setShowForgotPasswordVisibility] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignIn) {
        await signIn({
          email: email.trim().toLowerCase(),
          password,
        });
        toast.success("Welcome back");
      } else {
        await signUp({
          email: email.trim().toLowerCase(),
          password,
          pin,
        });
        toast.success("Account created");
      }
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "INVALID_PIN") setError("Invalid PIN");
        else if (err.message === "USER_EXISTS")
          setError("User already exists");
        else setError("Invalid email or password");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (
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
      setView("auth");
      setForgotPassword("");
      setForgotPin("");
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_PIN") {
        setError("Invalid PIN");
      } else {
        setError("Failed to reset password");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grow">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Not Yet Uhuru
        </h1>
        <p className="text-brand text-md mb-2 md:text-xl">
          Our future is ours to shape; Redefine the financial G-A-M-E with
          us
        </p>
      </div>

      {view === "auth" && (
        <form
          onSubmit={handleAuthSubmit}
          className="mt-auto mb-12 max-w-sm mx-auto w-full flex flex-col gap-4"
        >
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border px-4 py-3"
          />

          {!isSignIn ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border px-4 py-3 pr-10 w-full"
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
                className="w-18 rounded-xl border px-4 py-3 text-center"
              />
            </div>
          ) : (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border px-4 py-3 pr-10 w-full"
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
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-between px-2 text-sm text-gray-500">
            {isSignIn ? (
              <>
                <span
                  className="cursor-pointer"
                  onClick={() => {
                    setError(null);
                    setView("forgot");
                  }}
                >
                  Forgot Password?
                </span>
                <span
                  className="cursor-pointer text-brand"
                  onClick={() => router.push("/sign-up")}
                >
                  Sign Up
                </span>
              </>
            ) : (
              <span
                className="ml-auto cursor-pointer"
                onClick={() => router.push("/sign-in")}
              >
                Already have an account?
              </span>
            )}
          </div>

          <button
            disabled={loading}
            className="bg-black text-white font-semibold py-4 rounded-full"
          >
            {loading
              ? "In a Sec. ..."
              : isSignIn
              ? "Con·ti·nue"
              : "Système Join⁺"}
          </button>
        </form>
      )}

      {view === "forgot" && (
        <form
          onSubmit={handleForgotSubmit}
          className="mt-auto mb-12 max-w-sm mx-auto w-full flex flex-col gap-4"
        >
          <input
            type="email"
            value={email}
            readOnly
            className="rounded-xl border px-4 py-3 bg-gray-100"
          />

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={
                  showForgotPasswordVisibility ? "text" : "password"
                }
                placeholder="New Password"
                value={forgotPassword}
                onChange={(e) =>
                  setForgotPassword(e.target.value)
                }
                className="rounded-xl border px-4 py-3 pr-10 w-full"
              />
              <button
                type="button"
                onClick={() =>
                  setShowForgotPasswordVisibility((v) => !v)
                }
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

            <input
              type="text"
              maxLength={4}
              value={forgotPin}
              onChange={(e) =>
                setForgotPin(
                  e.target.value.replace(/\D/g, "").slice(0, 4)
                )
              }
              placeholder="PIN"
              className="w-18 rounded-xl border px-4 py-3 text-center"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end px-2 text-sm text-gray-500">
            <span
              className="cursor-pointer"
              onClick={() => {
                setError(null);
                setView("auth");
              }}
            >
              Back to Sign In
            </span>
          </div>

          <button
            disabled={loading}
            className="bg-black text-white font-semibold py-4 rounded-full"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </>
  );
}
