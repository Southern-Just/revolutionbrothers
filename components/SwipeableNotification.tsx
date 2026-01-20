"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { deleteNotification } from "@/lib/actions/notification.actions";
import { formatNotificationDate } from "@/lib/utils/utils";

type SwipeableNotificationProps = {
  id: string;
  title: string | null;
  message: string | null;
  createdAt: Date;
  unread: boolean;
  showBin: boolean;
  onDeleted: () => void;
};

const PARTIAL = -80;
const FULL = -140;

export function SwipeableNotification({
  id,
  title,
  message,
  createdAt,
  unread,
  onDeleted,
}: SwipeableNotificationProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.deltaX < 0) {
        setDragging(true);
        setOffset(Math.max(e.deltaX, FULL));
      }
    },
    onSwipedLeft: async (e) => {
      setDragging(false);

      if (-e.deltaX > 120) {
        await deleteNotification(id);
        onDeleted();
        return;
      }

      setOffset(PARTIAL);
    },
    onSwipedRight: () => {
      setDragging(false);
      setOffset(0);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  const showDelete = offset < 0;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-4
                   bg-red-500 text-white text-sm font-medium"
        style={{
          opacity: showDelete ? 1 : 0,
          transition: "opacity 150ms ease-out",
        }}
      >
        Delete
      </div>

      {/* Swipeable card */}
      <div
        {...handlers}
        className={`relative z-10 rounded-xl p-3 bg-background ${
          unread ? "bg-brand/10" : "bg-gray-50"
        }`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 220ms ease-out",
        }}
      >
        {title && <p className="font-medium">{title}</p>}
        {message && <p className="text-xs text-gray-600">{message}</p>}

        <p className="mt-1 text-[10px] text-gray-400">
          {formatNotificationDate(createdAt)}
        </p>
      </div>
    </div>
  );
}
