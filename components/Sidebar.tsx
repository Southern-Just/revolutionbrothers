"use client";
import { useState, useEffect } from "react";
import {
  getTermsPdf,
  logout,
  getCurrentUser,
} from "@/lib/actions/user.actions";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { downloadFile } from "@/lib/utils/downloadFile";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null); // Track user role
  const [loading, setLoading] = useState(true); // Prevent rendering until role is checked

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const user = await getCurrentUser();
        setUserRole(user?.role || null);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null); // Default to null on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    await logout();
    onClose();
    router.replace("/sign-in");
  };

  if (loading) {
    return null;
  }

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-1/2 z-50
        bg-black/60 backdrop-blur-xl text-white
        rounded-none shadow-2xl
        transform transition-all duration-500
        [ease-[cubic-bezier(0.16,1,0.3,1)]]
        ${
          open
            ? "translate-x-0 scale-100 opacity-100"
            : "translate-x-full scale-95 opacity-0"
        }`}
      >
        <div className="px-4 py-8 space-y-8 h-full relative">
          <div className="w-full flex justify-end">
            <button
              onClick={onClose}
              className="text-md text-end text-red-400 p-2 px-3 bg-red-100 rounded-full w-max font-bold  hover:opacity-70 hover:text-red-600 transition"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col space-y-6 px-4 text-lg">
            {[
              ["Members", "/members"],
              ["Profile", "/account"],
              ["Report", "/finances"],
              ["Resources", "/books"],
              // ["Settings", "/settings"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="hover:translate-x-1 hover:text-brand transition-all duration-300"
              >
                {label}
              </Link>
            ))}
          </nav>
          {userRole === "secretary" && (
            <Link
              href="/board"
              onClick={onClose}
              className="flex justify-center"
            >
              <Image
                src="/icons/transaction.svg"
                width={22}
                height={22}
                alt="secretary board"
              />
              <p className="text-gray-400 text-xs px-2 py-4">Secretary board</p>
            </Link>
          )}

          <div className=" space-y-8">
            <button
              onClick={handleLogout}
              className="text-brand px-4 text-left hover:opacity-70 transition mt-6"
            >
              Logout
            </button>

            <footer className="absolute bottom-10 w-full p-3.5 space-y-2 mx-auto">
              <div
                className=""
                onClick={async () => {
                  const { file, filename } = await getTermsPdf();
                  downloadFile(file, filename);
                }}
              >
                <div className="w-full flex justify-center">
                  <Image
                    src="/icons/download.svg"
                    width={54}
                    height={54}
                    alt="download terms"
                    className="mr-8 animate-bounce"
                  />
                </div>
                <Link href="/account" onClick={onClose}>
                  <p className="text-lg cursor-pointer hover:opacity-70 transition">
                    Download Terms
                  </p>
                </Link>
              </div>
              <p className="text-gray-400 text-sm">
                &copy; 2026 Revolution Brothers. All rights reserved.
              </p>
            </footer>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
