"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "./Sidebar";

import { toast } from "sonner";

import { getCurrentUser } from "@/lib/actions/user.actions";
import {
  getUserNotifications,
  markAllNotificationsRead,
} from "@/lib/actions/notification.actions";

const Header = () => {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof getUserNotifications>>
  >([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUserId(u.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    getUserNotifications()
      .then((data) => {
        setNotifications(data);
        setHasUnread(data.some((n) => !n.readBy.includes(userId)));
      })
      .catch(() => {
        toast.error("Failed to load notifications");
      });
  }, [userId]);

  async function refreshNotifications() {
    if (!userId) return;

    const data = await getUserNotifications();
    setNotifications(data);
    setHasUnread(data.some((n) => !n.readBy.includes(userId)));
  }

  return (
    <>
      <div className="w-full flex justify-between px-2 pr-4 py-1">
        <p
          className="text-brand p-4 px-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          Savings and investment co.
        </p>

        <div className="flex items-center gap-3">
          <div
            className="relative cursor-pointer"
            onClick={() => {
              setNotificationsOpen(true);
              refreshNotifications();
            }}
          >
            <Image
              src="/icons/bell.svg"
              width={14}
              height={14}
              alt="notifications"
              className="opacity-40"
            />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </div>

          <button onClick={() => setMenuOpen(true)}>
            <Image
              src="/icons/hamburger.svg"
              width={32}
              height={32}
              alt="menu"
            />
          </button>
        </div>
      </div>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {notificationsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-[90%] max-w-md rounded-2xl bg-background p-4 space-y-3">
            <p className="text-sm font-semibold">Notifications</p>

            {notifications.map((n) => {
              const unread = !n.readBy.includes(userId);
              return (
                <div
                  key={n.id}
                  className={`rounded-lg p-2 text-sm ${
                    unread ? "bg-brand/10" : "bg-gray-50"
                  }`}
                >
                  {n.title && <p className="font-medium">{n.title}</p>}
                  {n.message && (
                    <p className="text-xs text-gray-600">{n.message}</p>
                  )}
                </div>
              );
            })}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNotificationsOpen(false)}
                className="text-sm"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await markAllNotificationsRead();
                  setHasUnread(false);
                  setNotificationsOpen(false);
                }}
                className="text-sm text-brand"
              >
                Mark all as read
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
