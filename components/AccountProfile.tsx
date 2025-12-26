"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "./Footer";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile, type MyProfile } from "@/lib/actions/user.systeme";
import { uploadProfileImage } from "@/lib/actions/profile.action";

function FieldSkeleton() {
  return <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />;
}

export default function AccountProfile() {
  const [personal, setPersonal] = useState<MyProfile>({
    name: "",
    email: "",
    phone: "",
    username: "",
    nationalId: "",
    profileImage: null,
  });
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

  // Load profile from server
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
    return () => { mounted = false; };
  }, []);

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
      // Save all editable fields (including any changes to profileImage if updated separately)
      await updateMyProfile({
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        username: personal.username,
        nationalId: personal.nationalId,
        profileImage: personal.profileImage,  // Ensure it's included
      });
      toast.success("Profile updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Invalid file type");
      return;
    }
    try {
      // Upload image to ImageKit and get URL
      const url = await uploadProfileImage(file);
      
      // Persist the URL to the database
      await updateMyProfile({ profileImage: url });
      
      // Update local state
      setPersonal((p) => ({ ...p, profileImage: url }));
      toast.success("Profile image updated");
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const displayName = personal.username || personal.name || personal.email.split("@")[0];
  const fields = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Username", key: "username" },
    { label: "National ID", key: "nationalId" },
  ] as const;

  return (
    <div className="mx-auto mt-4 w-[94%] max-w-3xl font-sans space-y-4">
      <h2 className="mb-2 text-2xl font-semibold text-end text-brand mr-4 mb-6">
        {displayName} <span className="text-foreground">Details</span>
      </h2>

      <div className="mb-4 flex justify-center">
        <div className="w-[94%] max-w-md rounded-2xl bg-white/5 p-1 px-4 border-t border-t-gray-300 shadow flex items-center justify-between gap-8">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-200 p-0.5 relative">
              <Image
                src={personal.profileImage || "/icons/profiles.svg"}
                alt="profile"
                fill
                className="object-cover w-full h-full rounded-full"
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
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            )}
          </label>

          <div className="flex flex-col">
            <p className="text-lg font-semibold">{personal.name || "—"}</p>
            <p className="text-sm text-gray-400">
              @{personal.username || personal.email.split("@")[0]}
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl bg-white px-5 py-4 shadow-sm">
        {fields.map(({ label, key }) => (
          <div key={key} className="mb-4 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500">{label}</span>
            {!isLoaded ? (
              <FieldSkeleton />
            ) : isEditing ? (
              <input
                name={key}
                value={personal[key]}
                onChange={handleChange}
                className="w-56 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">{personal[key] || "—"}</p>
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
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${financialHealth}%` }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}