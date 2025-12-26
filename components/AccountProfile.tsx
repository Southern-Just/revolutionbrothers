"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "./Footer";
import { toast } from "sonner";

import {
  getMyProfile,
  updateMyProfile,
  type MyProfile,
} from "@/lib/actions/user.systeme";
import { uploadProfileImage } from "@/lib/actions/profile.action";

function FieldSkeleton() {
  return <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />;
}

const EMPTY_PROFILE: MyProfile = {
  name: "",
  email: "",
  phone: "",
  username: "",
  nationalId: "",
  profileImage: null,
  role: "member",
};

export default function AccountProfile() {
  const [personal, setPersonal] = useState<MyProfile>(EMPTY_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [creditLimit, setCreditLimit] = useState(10000);

  const totalSavings = 10000;
  const loanBalance = 1000;

  const financialHealth = Math.min(
    100,
    Math.round((totalSavings / creditLimit) * 100)
  );

  const refreshCreditLimit = () => {
    setCreditLimit(Math.floor(Math.random() * 20000) + 5000);
  };

  /* ---------------- LOAD PROFILE ---------------- */

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const profile = await getMyProfile();
        if (!profile || !mounted) return;

        setPersonal(profile);
        setIsLoaded(true);
      } catch {
        toast.error("Failed to load profile");
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------- HANDLERS ---------------- */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonal((p) => ({ ...p, [name]: value }));
  };

  const handleEditToggle = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setIsSaving(true);

      await updateMyProfile({
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        username: personal.username,
        nationalId: personal.nationalId,
        profileImage: personal.profileImage,
      });

      toast.success("Profile updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Invalid file type");
      return;
    }

    try {
      const url = await uploadProfileImage(file);

      await updateMyProfile({ profileImage: url });

      setPersonal((p) => ({ ...p, profileImage: url }));
      toast.success("Profile image updated");
    } catch {
      toast.error("Failed to upload image");
    }
  };

  /* ---------------- RENDER ---------------- */

  const displayName =
    personal.username ||
    personal.name ||
    (personal.email ? personal.email.split("@")[0] : "User");

  const fields = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Username", key: "username" },
    { label: "National ID", key: "nationalId" },
  ] as const;

  return (
    <div className="mx-auto mt-4 w-[94%] max-w-3xl space-y-4">
      <h2 className="mb-6 mr-4 text-end text-2xl font-semibold text-brand">
        {displayName} <span className="text-foreground">Details</span>
      </h2>

      {/* PROFILE HEADER */}
      <div className="mb-4 flex justify-center">
        <div className="flex w-[94%] max-w-md items-center justify-between gap-8 rounded-2xl border-t border-gray-300 bg-white/5 p-4 shadow">
          <label className="relative cursor-pointer">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border bg-gray-200 p-0.5">
              <Image
                src={personal.profileImage || "/icons/profiles.svg"}
                alt="profile"
                fill
                className="rounded-full object-cover"
              />

              {isEditing && (
                <Image
                  src="/icons/edit.svg"
                  alt="edit"
                  width={20}
                  height={20}
                  className="absolute bottom-0 right-0"
                />
              )}
            </div>

            {isEditing && (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            )}
          </label>

          <div>
            <p className="text-lg font-semibold">{personal.name || "—"}</p>
            <p className="text-sm text-gray-400">
              @{personal.username || displayName}
            </p>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <section className="rounded-2xl bg-white px-5 py-4 shadow-sm">
        {fields.map(({ label, key }) => (
          <div key={key} className="mb-4 flex justify-between gap-4">
            <span className="text-sm text-gray-500">{label}</span>

            {!isLoaded ? (
              <FieldSkeleton />
            ) : isEditing ? (
              <input
                name={key}
                value={personal[key]}
                onChange={handleChange}
                className="w-56 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-brand"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">
                {personal[key] || "—"}
              </p>
            )}
          </div>
        ))}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleEditToggle}
            disabled={!isLoaded || isSaving}
            className="rounded-xl bg-brand px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit"}
          </button>
        </div>
      </section>

      {/* FINANCIAL SUMMARY */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex justify-between">
          <span>Credit Limit</span>
          <div className="flex items-center gap-4">
            <button onClick={refreshCreditLimit}>⟳</button>
            <p>Ksh {creditLimit.toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-3 flex justify-between">
          <span>Loan Balance</span>
          <p>Ksh {loanBalance.toLocaleString()}</p>
        </div>

        <div className="mb-3 flex justify-between">
          <span>Total Savings</span>
          <p>Ksh {totalSavings.toLocaleString()}</p>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <span>Financial Health</span>
            <span>{financialHealth}%</span>
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${financialHealth}%` }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
