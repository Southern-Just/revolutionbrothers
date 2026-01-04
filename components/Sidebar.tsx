"use client";
import { getTermsPdf, logout } from "@/lib/actions/user.actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { downloadFile } from "@/lib/utils/downloadFile";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ open, onClose }: SidebarProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    onClose();
    router.replace("/sign-in");
  };

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
              ["Books", "/books"],
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

          <button
            onClick={handleLogout}
            className="text-brand px-4 text-left hover:opacity-70 transition mt-6"
          >
            Logout
          </button>

          <footer className="absolute bottom-10 w-full p-4 space-y-6">
            <Link href="/account" onClick={onClose}>
              <p
                onClick={async () => {
                  const { file, filename } = await getTermsPdf();
                  downloadFile(file, filename);
                }}
                className="text-lg cursor-pointer hover:opacity-70 transition"
              >
                Download Terms
              </p>
            </Link>

            <p className="text-gray-400 text-sm">
              &copy; 2025 Revolution Brothers. All rights reserved.
            </p>
          </footer>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
