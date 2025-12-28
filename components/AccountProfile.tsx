"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Footer from "./Footer";
import { toast } from "sonner";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 50, aspect: 1 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Invalid file type");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: PixelCrop,
    fileName: string
  ): Promise<Blob | null> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = 80;
    canvas.height = 80;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      80,
      80
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const handleCropConfirm = async () => {
    if (!completedCrop || !selectedFile || !imageSrc) {
      toast.error("Please select a crop area.");
      return;
    }

    const image = new window.Image();
    image.src = imageSrc;
    image.onload = async () => {
      const croppedBlob = await getCroppedImg(image, completedCrop, selectedFile.name);
      if (!croppedBlob) {
        toast.error("Failed to process image.");
        return;
      }

      const croppedFile = new File([croppedBlob], selectedFile.name, { type: "image/jpeg" });

      try {
        const url = await uploadProfileImage(croppedFile);

        await updateMyProfile({ profileImage: url });

        setPersonal((p) => ({ ...p, profileImage: url }));
        toast.success("Profile image updated");
        setCropModalOpen(false);
        setSelectedFile(null);
        setImageSrc("");
        setCompletedCrop(null);
      } catch {
        toast.error("Failed to upload image");
      }
    };
  };

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

      <div className="mb-4 flex justify-center">
        <div className="flex w-[94%] max-w-md items-center justify-between gap-8 rounded-2xl border border-gray-200 p-4 shadow-sm">
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

      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Crop Your Image</h3>
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={setCompletedCrop}
              aspect={1}
              onLoad={(img) => {
                const size = Math.min(img.width, img.height);
                setCrop({
                  unit: "px",
                  width: size,
                  height: size,
                  x: (img.width - size) / 2,
                  y: (img.height - size) / 2,
                });
              }}
            >
              <img src={imageSrc} alt="Crop preview" className="max-w-full" />
            </ReactCrop>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="px-4 py-2 bg-brand text-white rounded"
              >
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="px-5 py-4 ">
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