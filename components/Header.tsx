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
      <div className="mb-0 w-full justify-between flex px-2 py-1">
        <p className="text-brand indent-0.5 p-6 px-2" onClick={()=>{router.push("/")}}>Savings and investment co.</p>
                <button
          className="cursor-pointer text-xl"
          onClick={() => {
            setOpen(true);
          }}
        >
          <Image src="/icons/hamburger-menu.svg" width={60} height={60} alt="hamburger"/>
        </button>
      </div>
      <div>

      </div>
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default Header;
