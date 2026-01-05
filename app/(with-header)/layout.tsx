"use client";

import Header from "@/components/Header";
import { ReactNode, useEffect, useState } from "react";

const Layout = ({ children }: { children: ReactNode }) => {
  const [isAllowed, setIsAllowed] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsAllowed(width <= 768 && height > width);
    };

    checkAccess();
    window.addEventListener("resize", checkAccess);
    return () => window.removeEventListener("resize", checkAccess);
  }, []);

  const showBlock = !isAllowed || animatingOut;

  if (showBlock) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
          isAllowed ? "opacity-0" : "opacity-100"
        }`}
        onTransitionEnd={() => {
          if (isAllowed) setAnimatingOut(false);
        }}
      >
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col justify-center items-center text-center space-y-6">
            <p className="text-gray-500 text-3xl font-semibold">Sorry G 😢</p>

            <div className="text-brand grid grid-cols-[max-content_auto] gap-1">
              <span>Either you are on:</span>
              <div className="text-xs flex flex-col text-gray-500 px-2 py-1 space-y-3 text-start border border-brand">
                <span>A device larger than a mobile screen</span>
                <span className="ml-10">or</span>
                <span>your device is in landscape mode</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs">
                Please use a <span className="text-xl text-red-200">*</span>mobile
                screen and portrait mode only
              </p>
              <p className="text-[9px] text-brand text-end">
                Thanks for understanding, Tutashugulikia
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      {children}
    </div>
  );
};

export default Layout;
