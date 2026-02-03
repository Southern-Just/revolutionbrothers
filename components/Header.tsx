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
import { SwipeableNotification } from "./SwipeableNotification";

type Notifications = Awaited<ReturnType<typeof getUserNotifications>>;

const CACHE_INBOX = "notifications:inbox";
const CACHE_BIN = "notifications:bin";

const Header = () => {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showBin, setShowBin] = useState(false);

  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] =
    useState<Notifications>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) setUserId(user.id);
    });
  }, []);

  function getCacheKey(bin: boolean) {
    return bin ? CACHE_BIN : CACHE_INBOX;
  }

  function loadFromCache(bin: boolean): Notifications | null {
    const raw = sessionStorage.getItem(getCacheKey(bin));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as Notifications;
      return parsed.map((n) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    } catch {
      return null;
    }
  }

  function saveToCache(bin: boolean, data: Notifications) {
    sessionStorage.setItem(
      getCacheKey(bin),
      JSON.stringify(data),
    );
  }

  function invalidateCache() {
    sessionStorage.removeItem(CACHE_INBOX);
    sessionStorage.removeItem(CACHE_BIN);
  }

  async function loadNotifications(bin = showBin) {
    if (!userId) return;

    const cached = loadFromCache(bin);
    if (cached) {
      setNotifications(cached);
      setHasUnread(
        cached.some((n) => !n.readBy.includes(userId)),
      );
      return;
    }

    try {
      const data = await getUserNotifications(bin);
      setNotifications(data);
      setHasUnread(
        data.some((n) => !n.readBy.includes(userId)),
      );
      saveToCache(bin, data);
    } catch {
      toast.error("Failed to load notifications");
    }
  }

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const data = await getUserNotifications(false);

        setHasUnread(
          data.some((n) => !n.readBy.includes(userId)),
        );

        saveToCache(false, data);

        if (notificationsOpen && !showBin) {
          setNotifications(data);
        }
      } catch {}
    }, 8000);

    return () => clearInterval(interval);
  }, [userId, notificationsOpen, showBin]);

  return (
    <>
      <div className="flex w-full justify-between px-2 pr-4 py-1">
        <p
          className="cursor-pointer p-4 px-2 text-brand"
          onClick={() => router.push("/")}
        >
          Savings and investment co.
        </p>

        <div className="flex items-center gap-3">
          <div
            className="relative cursor-pointer"
            onClick={() => {
              setNotificationsOpen(true);
              loadNotifications();
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
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-[90%] max-w-md rounded-2xl bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {showBin ? "Bin" : "Notifications"}
              </p>

              <button
                onClick={() => {
                  const next = !showBin;
                  setShowBin(next);
                  loadNotifications(next);
                }}
                className="text-xs text-gray-500"
              >
                {showBin ? "Inbox" : "Bin"}
              </button>
            </div>

            <div className="space-y-2">
              {notifications.map((n) => (
                <SwipeableNotification
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  message={n.message}
                  createdAt={n.createdAt}
                  unread={!n.readBy.includes(userId)}
                  showBin={showBin}
                  onDeleted={() => {
                    setNotifications((prev) =>
                      prev.filter((x) => x.id !== n.id),
                    );
                    invalidateCache();
                  }}
                />
              ))}

              {notifications.length === 0 && (
                <p className="py-6 text-center text-xs text-gray-400">
                  No notifications
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNotificationsOpen(false)}
                className="text-sm"
              >
                Close
              </button>

              {!showBin && (
                <button
                  onClick={async () => {
                    await markAllNotificationsRead();
                    invalidateCache();
                    setHasUnread(false);
                    setNotificationsOpen(false);
                  }}
                  className="text-sm text-brand"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
