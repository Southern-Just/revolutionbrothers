"use client";
import Link from "next/link";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/50 z-40" />
      )}

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-1/2 bg-black/70 text-white z-50
        transform transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="px-2 py-8 space-y-6">
          <button
            onClick={onClose}
            className="text-sm text-end text-red-500 font-bold w-full"
          >
            Close ✕
          </button>

          <nav className="flex flex-col space-y-6 px-4 text-lg">
            <Link href="/finances" onClick={onClose}>
              My Finances
            </Link>
            <Link href="/members" onClick={onClose}>
              Members
            </Link>
            <Link href="/settings" onClick={onClose}>
              Settings
            </Link>
            <Link href="/books" onClick={onClose}>
              Books
            </Link>
            <Link href="/account" onClick={onClose}>
              Account
            </Link>
          </nav>
          <footer className="absolute bottom-12 text-sm w-full space-y-6 p-0.5">
            <Link href="/account" onClick={onClose}>
              <p className="text-lg mb-6">Download Terms</p>
            </Link>
            <p className="text-gray-400 p-1">
              &copy; 2025 Revolution Brothers. All rights reserved.
            </p>
          </footer>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
