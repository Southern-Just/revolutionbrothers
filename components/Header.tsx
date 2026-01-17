"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Header = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="mb-0 w-full justify-between flex px-2 pr-4 py-1">
          <p
            className="text-brand indent-0.5 p-4 px-2"
            onClick={() => {
              router.push("/");
            }}
          >
            Savings and investment co.
          </p>
        <div className="flex justify-center gap-2">
          <Image
            src="/icons/bell.svg"
            width={14}
            height={14}
            alt="notifications"
            className="opacity-40"
          />

          <button
            className="cursor-pointer text-xl"
            onClick={() => {
              setOpen(true);
            }}
          >
            <Image
              src="/icons/hamburger.svg"
              width={32}
              height={32}
              alt="hamburger"
            />
          </button>
        </div>
      </div>
      <div></div>
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default Header;
 