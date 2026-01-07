"use client";

import Header from "@/components/Header";
import { ReactNode, useEffect, useRef, useState } from "react";
import { logout, touchSession } from "@/lib/actions/user.actions";

const INACTIVITY_LIMIT = 15 * 60 * 1000;

const Layout = ({ children }: { children: ReactNode }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(async () => {
      await logout();
      window.location.href = "/sign-in";
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width > 768 || width > height) {
        setShowOverlay(true);
        setAnimateOut(false);
      } else if (showOverlay) {
        setAnimateOut(true);
        setTimeout(() => {
          setShowOverlay(false);
          setAnimateOut(false);
        }, 500);
      }
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, [showOverlay]);

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    const onActivity = async () => {
      resetInactivityTimer();
      await touchSession();
    };

    events.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );

    resetInactivityTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, onActivity)
      );

      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleLeave = () => {
      navigator.sendBeacon("/_next/server-actions/logout");
    };

    window.addEventListener("pagehide", handleLeave);
    window.addEventListener("beforeunload", handleLeave);

    return () => {
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <Header />
      {children}

      {showOverlay && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-2xl transition-opacity duration-500 ${
            animateOut ? "opacity-0" : "opacity-100"
          }`}
        >
          <div
            className={`bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 ${
              animateOut
                ? "-translate-y-12 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <p className="text-gray-500 text-3xl font-semibold">Sorry G 😢</p>

            <div className="text-brand grid grid-cols-[max-content_auto] gap-1 mt-4">
              <span>Either you are on:</span>
              <div className="text-xs flex flex-col text-gray-500 px-2 py-1 space-y-3 text-start border border-brand">
                <span>A device larger than a mobile screen</span>
                <span className="ml-10">or</span>
                <span>your device is in landscape mode</span>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-xs">
                Please use a <span className="text-xl text-red-200">*</span>mobile
                screen and portrait mode
              </p>
              <p className="text-[9px] text-brand text-end">
                Thanks for understanding, Tutashugulikia
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
