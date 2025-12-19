"use client";

import { useState } from "react";
import { mockData } from "@/lib/mock";
import Footer from "./Footer";

const Profile = () => {
  const currentUser = mockData.members.find((m) => m.userId === "1")!;

  const [isEditing, setIsEditing] = useState(false);

  const [personal, setPersonal] = useState({
    name: currentUser.name,
    email: "patrick@example.com",
    phone: currentUser.phone ?? "+254712345678",
    username: "patrick_smith",
    nationalId: "32847561",
  });

  const totalSavings = currentUser.contributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const [creditLimit, setCreditLimit] = useState(100000);

  const financials = {
    creditLimit,
    loanBalance: 25000,
    savings: totalSavings,
  };

  const financialHealth = Math.min(
    100,
    Math.round((financials.savings / financials.creditLimit) * 100)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonal((prev) => ({ ...prev, [name]: value }));
  };

  const refreshCreditLimit = () => {
    const newLimit = Math.floor(Math.random() * 200000) + 50000;
    setCreditLimit(newLimit);
  };

  // Unified button click handler
  const handleAction = () => {
    if (isEditing) {
      // Save changes logic here
      console.log("Saved changes:", personal);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  return (
    <div className="mx-auto mt-2 w-[94%] max-w-3xl font-sans page-animate">
      {/* Header */}
      <div className="mb-2 flex w-full items-center justify-end p-2 ">
        <h2 className="text-2xl font-semibold text-brand shadow-lg shadow-brand/40 mr-4">{personal.username}<span className="text-foreground"> Details</span></h2>
      </div>

      {/* Personal Details */}
      <section className="rounded-2xl bg-white px-4 py-2 shadow-sm">
        <p className="text-[11px] mb-6">
          At your convenience update or modify your profile information from here
        </p>

        {[
          { label: "Name", key: "name" },
          { label: "Email", key: "email" },
          { label: "Phone Number", key: "phone" },
          { label: "Username", key: "username" },
          { label: "National ID", key: "nationalId" },
        ].map(({ label, key }) => (
          <div key={key} className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">{label}</span>
            {isEditing ? (
              <input
                name={key}
                value={personal[key as keyof typeof personal]}
                onChange={handleChange}
                className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-sm font-medium text-gray-800">
                {personal[key as keyof typeof personal]}
              </p>
            )}
          </div>
        ))}

        {/* Unified Action Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAction}
            className="rounded-xl bg-brand px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand/70"
          >
            {isEditing ? "Save Changes" : "Edit"}
          </button>
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="ml-2 rounded-xl border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
            >
              Cancel
            </button>
          )}
        </div>
      </section>

      {/* Financial Details */}
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">Financial Details</h3>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">Credit Limit</span>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshCreditLimit}
              className="rounded bg-gray-200 px-2 py-0.5 text-xs hover:bg-gray-300"
            >
              ⟳
            </button>
            <p className="text-sm font-medium text-gray-800">
              ksh {financials.creditLimit.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">Loan Balance</span>
          <p className="text-sm font-medium text-gray-800">
            ksh {financials.loanBalance.toLocaleString()}
          </p>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">Total Savings</span>
          <p className="text-sm font-medium text-gray-800">
            ksh {financials.savings.toLocaleString()}
          </p>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">Financial Health</span>
            <span className="text-xs font-medium text-gray-600">
              {financialHealth}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-linear-to-r from-green-400 to-green-600 transition-all"
              style={{ width: `${financialHealth}%` }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;
