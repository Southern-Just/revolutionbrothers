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

const Header = () => {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showBin, setShowBin] = useState(false);

  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState<Notifications>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) setUserId(user.id);
    });
  }, []);

  async function loadNotifications(bin = showBin) {
    if (!userId) return;

    try {
      const data = await getUserNotifications(bin);
      setNotifications(data);
      setHasUnread(data.some((n) => !n.readBy.includes(userId)));
    } catch {
      toast.error("Failed to load notifications");
    }
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
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
          <div className="w-[90%] max-w-md rounded-2xl bg-background backdrop-blur-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {showBin ? "Bin" : "Notifications"}
              </p>

              <button
                onClick={() => {
                  setShowBin((v) => !v);
                  loadNotifications(!showBin);
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
                  onDeleted={() =>
                    setNotifications((prev) =>
                      prev.filter((x) => x.id !== n.id)
                    )
                  }
                />
              ))}

              {notifications.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">
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
