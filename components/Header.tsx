import { useState } from "react";
import Sidebar from "./Sidebar";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-0 w-full justify-between flex px-2 py-3">
        <p className="text-brand p-2 indent-0.5">Savings and investment co.</p>
        <button
          className="py-2 cursor-pointer"
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
