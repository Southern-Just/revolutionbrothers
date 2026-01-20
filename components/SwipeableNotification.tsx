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

  const handlers = useSwipeable({
    onSwiping: (e) => {
      if (e.deltaX < 0) {
        setOffset(Math.max(-e.deltaX * -1, FULL));
      }
    },
    onSwipedLeft: async (e) => {
      if (-e.deltaX > 120) {
        await deleteNotification(id);
        onDeleted();
        return;
      }
      setOffset(PARTIAL);
    },
    onSwipedRight: () => {
      setOffset(0);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4 text-white text-sm">
        Delete
      </div>

      <div
        {...handlers}
        style={{
          transform: `translateX(${offset}px)`,
          transition: "transform 0.2s ease",
        }}
        className={`relative z-10 p-3 rounded-lg bg-background ${
          unread ? "bg-brand/10" : "bg-gray-50"
        }`}
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
