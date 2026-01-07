"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/actions/user.actions"; // Import to check user role

type StoredFile = {
  name: string;
  type: string;
};

type Notification = {
  id: string;
  title?: string;
  message?: string;
  editing?: boolean;
};

export default function Page() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false); // Track if user is authorized
  const [loading, setLoading] = useState(true); // Prevent rendering until check is done

  const [terms, setTerms] = useState<StoredFile | null>(null);
  const [minutes, setMinutes] = useState<StoredFile | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMessage, setDraftMessage] = useState("");

  const [note, setNote] = useState("");

  // Role check and redirect on component mount
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = await getCurrentUser();
        if (user && user.role === "secretary") {
          setIsAuthorized(true);
        } else {
          router.push("/"); // Redirect non-secretaries or unauthenticated users
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/"); // Redirect on error
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [router]);

  // Show loading state while checking (prevents flash of content)
  if (loading) {
    return (
      <main className="mx-auto mt-4 w-[94%] max-w-4xl">
        <p className="text-center text-gray-500">Loading...</p>
      </main>
    );
  }

  // If not authorized, don't render anything (though redirect should handle it)
  if (!isAuthorized) {
    return null;
  }

  /* ---------------- FILE HANDLERS ---------------- */

  function handleReplaceFile(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "terms" | "minutes"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const payload = { name: file.name, type: file.type };

    if (target === "terms") setTerms(payload);
    if (target === "minutes") setMinutes(payload);

    toast.success(`${target === "terms" ? "Terms" : "Minutes"} updated`);
    e.target.value = "";
  }

  /* ---------------- NOTIFICATIONS ---------------- */

  function addNotificationFromDraft() {
    if (!draftTitle && !draftMessage) {
      toast.error("Notification cannot be empty");
      return;
    }

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
  }

  function updateNotification(
    id: string,
    field: "title" | "message",
    value: string
  ) {
    setNotifications((n) =>
      n.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function toggleEdit(id: string) {
    setNotifications((n) =>
      n.map((item) =>
        item.id === id ? { ...item, editing: !item.editing } : item
      )
    );
  }

  function deleteNotification(id: string) {
    setNotifications((n) => n.filter((item) => item.id !== id));
  }

  /* ---------------- NOTES ---------------- */

  function saveNote() {
    toast.success("Note saved");
  }

  function noteToNotification() {
    if (!note.trim()) {
      toast.error("Note is empty");
      return;
    }

    setNotifications((n) => [
      {
        id: crypto.randomUUID(),
        message: note,
      },
      ...n,
    ]);

    setNote("");
    toast.success("Note added as notification");
  }

  return (
    <main className="mx-auto mt-4 w-[94%] max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold text-brand text-start ml-4">
        Secretary Board
      </h1>

      {/* DOCUMENTS */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-background p-4 shadow-sm shadow-gray-300">
          <p className="text-sm font-semibold mb-2">Terms & Conditions</p>

          {terms ? (
            <p className="text-sm text-gray-600 truncate">{terms.name}</p>
          ) : (
            <p className="text-sm text-gray-400">No file uploaded</p>
          )}

          <label className="mt-3 inline-block text-sm text-brand cursor-pointer">
            Replace file
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleReplaceFile(e, "terms")}
            />
          </label>
        </div>

        <div className="rounded-2xl bg-background p-4 shadow-sm border border-gray-200">
          <p className="text-sm font-semibold mb-2">Meeting Minutes</p>

          {minutes ? (
            <p className="text-sm text-gray-600 truncate">{minutes.name}</p>
          ) : (
            <p className="text-sm text-gray-400">No file uploaded</p>
          )}

          <label className="mt-3 inline-block text-sm text-brand cursor-pointer">
            Replace file
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => handleReplaceFile(e, "minutes")}
            />
          </label>
        </div>
      </section>

      {/* ADD NOTIFICATION */}
      <section className="rounded-2xl border border-gray-200 bg-background p-4 shadow-sm space-y-3">
        <p className="text-sm font-semibold">New Notification</p>

        <input
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-lg border border-gray-400 outline-none px-3 py-2 text-sm"
        />

        <textarea
          value={draftMessage}
          onChange={(e) => setDraftMessage(e.target.value)}
          placeholder="Message (optional)"
          className="w-full rounded-lg border border-gray-400 outline-none px-3 py-2 text-sm resize-none"
        />
        <div className="flex justify-end">
          <button
            onClick={addNotificationFromDraft}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white "
          >
            Publish
          </button>
        </div>
      </section>

      {/* NOTIFICATIONS LIST */}
      <section className="space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="rounded-2xl border bg-background p-4 shadow-sm space-y-2"
          >
            {n.editing ? (
              <>
                <input
                  value={n.title || ""}
                  onChange={(e) =>
                    updateNotification(n.id, "title", e.target.value)
                  }
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <textarea
                  value={n.message || ""}
                  onChange={(e) =>
                    updateNotification(n.id, "message", e.target.value)
                  }
                  className="w-full rounded border px-2 py-1 text-sm resize-none"
                />
              </>
            ) : (
              <>
                {n.title && <p className="font-semibold">{n.title}</p>}
                {n.message && (
                  <p className="text-sm text-gray-600">{n.message}</p>
                )}
              </>
            )}

            <div className="flex gap-4 text-sm">
              <button onClick={() => toggleEdit(n.id)} className="text-brand">
                {n.editing ? "Done" : "Edit"}
              </button>
              <button
                onClick={() => deleteNotification(n.id)}
                className="text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* NOTES */}
      <section className="bg-background p-3 shadow-sm space-y-3">
        <p className="text-sm font-semibold">Notes</p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write notes here..."
          className="w-full rounded-lg border outline-brand px-3 py-2 text-sm resize-none"
        />

        <div className="flex justify-end gap-4">
          <button
            onClick={saveNote}
            className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold"
          >
            Save
          </button>
          <button
            onClick={noteToNotification}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
          >
            Make Notification
          </button>
        </div>
      </section>
    </main>
  );
}