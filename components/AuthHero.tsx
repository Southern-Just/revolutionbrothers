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

export default function AuthHero({ mode }: AuthHeroProps) {
  const router = useRouter();
  const isSignIn = mode === "sign-in";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotPin, setForgotPin] = useState("");
  const [showForgotPasswordVisibility, setShowForgotPasswordVisibility] =
    useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        else if (err.message === "USER_EXISTS") setError("User already exists");
        else setError("Invalid email or password");
      } else {
        setError("Something went wrong");
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
      {isSignIn && showForgotPassword && (
        <div className="fixed inset-0 z-999 -mt-90 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 px-6">
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
                className="rounded-xl border px-4 py-3 bg-gray-100"
              />

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type={
                      showForgotPasswordVisibility ? "text" : "password"
                    }
                    value={forgotPassword}
                    onChange={(e) =>
                      setForgotPassword(e.target.value)
                    }
                    placeholder="New Password"
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

              <button
                disabled={loading}
                className="bg-black text-white font-semibold py-4 rounded-full"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grow">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Not Yet Uhuru
        </h1>
        <p className="text-brand text-md mb-2 md:text-xl">
          Our future is ours to shape; Redefine the financial G-A-M-E with us
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
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
                onClick={() => setShowForgotPassword(true)}
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
    </>
  );
}