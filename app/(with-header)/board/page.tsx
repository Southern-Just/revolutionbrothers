"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

import {
  getCurrentUser,
  getTermsMeta,
  uploadTermsPdf,
} from "@/lib/actions/user.actions";
import { getAllUsers, updateUserProfile } from "@/lib/actions/user.systeme";
import { createNotification } from "@/lib/actions/notification.actions";

type StoredFile = {
  name: string;
  type: string;
};

type Notification = {
  id: string;
  title?: string;
  message?: string;
};

type UserRole = "secretary" | "treasurer" | "chairperson" | "member";

type Member = {
  userId: string;
  name: string;
  role: UserRole;
  profileImage: string | null;
};

const OFFICIAL_ROLES: UserRole[] = ["secretary", "treasurer", "chairperson"];

export default function Page() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [closing, setClosing] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [activeUserId, setActiveUserId] = useState("");

  const [terms, setTerms] = useState<StoredFile | null>(null);
  const [minutes, setMinutes] = useState<StoredFile | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const [rolesOpen, setRolesOpen] = useState(false);

  const [confirm, setConfirm] = useState<{
    userId: string;
    role: UserRole;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const user = await getCurrentUser();

        if (!user || user.role !== "secretary") {
          router.push("/");
          return;
        }

        const meta = await getTermsMeta();
        if (mounted && meta?.name) {
          setTerms({
            name: meta.name,
            type: "application/pdf",
          });
        }

        const data = await getAllUsers();
        if (!mounted) return;

        const merged: Member[] = [
          ...Object.values(data.officials).filter(Boolean),
          ...data.others,
        ].map((u) => ({
          userId: u.userId,
          name: u.name,
          role: u.role as UserRole,
          profileImage: u.profileImage,
        }));

        setMembers(merged);
        setActiveUserId(data.activeUserId);
        setAuthorized(true);
      } catch {
        router.push("/");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="mx-auto mt-6 text-center text-gray-500">Loading…</main>
    );
  }

  if (!authorized) return null;

  async function performAssign(userId: string, role: UserRole) {
    await updateUserProfile({ userId, role });
    toast.success("Role updated");

    if (role === "secretary" && userId !== activeUserId) {
      handleClose();
      return;
    }

    const refreshed = await getAllUsers();
    const merged: Member[] = [
      ...Object.values(refreshed.officials).filter(Boolean),
      ...refreshed.others,
    ].map((u) => ({
      userId: u.userId,
      name: u.name,
      role: u.role as UserRole,
      profileImage: u.profileImage,
    }));

    setMembers(merged);
    setActiveUserId(refreshed.activeUserId);
  }

  function assignRole(userId: string, role: UserRole) {
    const currentSecretary = members.find((m) => m.role === "secretary");

    if (
      role === "secretary" &&
      currentSecretary?.userId === activeUserId &&
      userId !== activeUserId
    ) {
      setConfirm({ userId, role });
      return;
    }

    performAssign(userId, role).catch(() =>
      toast.error("Failed to update role"),
    );
  }

  async function handleReplaceFile(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "terms" | "minutes",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "terms") {
      if (file.type !== "application/pdf") {
        toast.error("Terms must be a PDF");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      await uploadTermsPdf(formData);
    }

    await createNotification({
      title:
        target === "terms"
          ? "Terms & Conditions Updated"
          : "Meeting Minutes Updated",
      message: file.name,
      type: target === "terms" ? "terms_update" : "minutes_update",
    });

    const payload = {
      name: file.name,
      type: file.type,
    };
    target === "terms" ? setTerms(payload) : setMinutes(payload);

    toast.success("File updated");
    e.target.value = "";
  }

  async function addNotification() {
    if (!draftTitle && !draftMessage) {
      toast.error("Notification cannot be empty");
      return;
    }

    try {
      await createNotification({
        title: draftTitle || undefined,
        message: draftMessage || undefined,
        type: "announcement",
      });

      toast.success("Notification published");

      setNotifications((n) => [
        {
          id: crypto.randomUUID(),
          title: draftTitle || undefined,
          message: draftMessage || undefined,
        },
        ...n,
      ]);

      setDraftTitle("");
      setDraftMessage("");
    } catch {
      toast.error("Failed to publish notification");
    }
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => router.push("/"), 500);
  }

  return (
    <main
      className={`mx-auto mt-4 w-[94%] max-w-4xl space-y-6 ${
        closing ? "modal-slide-down" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4">
        <h1 className="text-2xl font-semibold text-brand">Secretary Board</h1>
        <button
          onClick={handleClose}
          className="text-sm text-gray-500 shadow shadow-gray-300 p-1 px-2 rounded-lg hover:text-brand"
        >
          Close
        </button>
      </div>

      <section className="rounded-2xl border border-gray-300 bg-background p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold">New Notification</p>
        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-lg border border-brand/90 outline-brand px-3 py-2 text-sm"
        />
        <textarea
          value={draftMessage}
          onChange={(e) => setDraftMessage(e.target.value)}
          placeholder="Message (optional)"
          className="w-full rounded-lg border outline-brand border-brand/90 px-3 py-2 text-sm resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={addNotification}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Publish
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          ["Meeting Minutes", minutes, "minutes"] as const,
          ["Terms & Conditions", terms, "terms"] as const,
        ].map(([label, file, key]) => (
          <div
            key={key}
            className="rounded-2xl bg-background p-4 shadow-sm border border-gray-300"
          >
            <p className="text-sm font-semibold mb-2">{label}</p>
            <p className="text-sm text-gray-600">
              {file ? file.name : "No file uploaded"}
            </p>
            <label className="mt-3 inline-block text-sm text-brand cursor-pointer">
              Replace file
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  handleReplaceFile(e, key as "terms" | "minutes")
                }
              />
            </label>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-background p-4 shadow-sm mb-12">
        <button
          onClick={() => setRolesOpen((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          Role Assignment
          <span>{rolesOpen ? "−" : "+"}</span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            rolesOpen ? "max-h-200 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          {OFFICIAL_ROLES.map((role) => {
            const current = members.find((m) => m.role === role);

            return (
              <div key={role} className="space-y-2 mb-4">
                <p className="text-sm capitalize font-medium">{role}</p>

                <div className="flex flex-wrap gap-3">
                  {members.map((m) => {
                    const disabled = current?.userId === m.userId;

                    return (
                      <button
                        key={m.userId}
                        disabled={disabled}
                        onClick={() => !disabled && assignRole(m.userId, role)}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                          disabled
                            ? "cursor-not-allowed border-brand bg-brand/10 opacity-60"
                            : "hover:border-brand"
                        }`}
                      >
                        <Image
                          src={m.profileImage || "/avatar.png"}
                          alt={m.name}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                        <span>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[90%] max-w-sm rounded-2xl bg-background p-6 space-y-4">
            <p className="text-sm font-semibold">Transfer Secretary Role?</p>
            <p className="text-sm text-gray-600">
              You will lose secretary access immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="rounded-lg border px-3 py-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  performAssign(confirm.userId, confirm.role);
                  setConfirm(null);
                }}
                className="rounded-lg bg-brand px-3 py-1 text-sm text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
