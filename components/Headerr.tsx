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
      <div className="mb-0 w-full justify-between flex items-center px-2 py-3">
        <p className="text-brand indent-0.5" onClick={()=>{router.push("/revolution")}}>Savings and investment co.</p>
                <button
          className="cursor-pointer text-xl"
          onClick={() => {
            setOpen(true);
          }}
        >\rek
          <Image src="/icons/hamburger.svg" width={120} height={120} alt="hamburger"/>
        </button>
      </div>
      <div>

      </div>
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default Header;