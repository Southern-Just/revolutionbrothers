"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import { useRouter } from "next/navigation";


const Header = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="mb-0 w-full justify-between flex px-2 py-3">
        <p className="text-brand p-2 indent-0.5" onClick={()=>{router.push("/revolution")}}>Savings and investment co.</p>
        <button
          className="py-2 px-4 cursor-pointer text-xl"
          onClick={() => {
            setOpen(true);
          }}
        >
          🔘
        </button>
      </div>
      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default Header;
