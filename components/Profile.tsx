"use client";

import { useState } from "react";
import Footer from "./Footer";
import { mockData } from "@/lib/mock";

type Contribution = {
month: string;
amount: number;
};

type Member = {
userId: string;
name: string;
role: string;
image: string | null;
phone?: string;
contributions: Contribution[];
};

export default function Profile() {
const member: Member = mockData.members[0];
const [isEditing, setIsEditing] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [personal, setPersonal] = useState({
name: member.name || "",
email: "",
phone: member.phone ?? "",
username: "",
nationalId: "",
});

const [creditLimit, setCreditLimit] = useState(100_000);

const totalSavings = member.contributions.reduce(
(sum, c) => sum + c.amount,
0
);

const financials = {
creditLimit,
loanBalance: 0,
savings: totalSavings,
};

const financialHealth = Math.min(
100,
Math.round((financials.savings / financials.creditLimit) * 100)
);

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
const { name, value } = e.target;
setPersonal((p) => ({ ...p, [name]: value }));
};

const handleEditToggle = () => {
setIsSaving(true);
setTimeout(() => setIsSaving(false), 500);
setIsEditing((v) => !v);
};

const refreshCreditLimit = () => {
setCreditLimit(Math.floor(Math.random() * 200_000) + 50_000);
};

const fields = [
{ label: "Name", key: "name" },
{ label: "Email", key: "email" },
{ label: "Phone Number", key: "phone" },
{ label: "Username", key: "username" },
{ label: "National ID", key: "nationalId" },
] as const;

return (
<div className="mx-auto mt-2 w-[94%] max-w-3xl font-sans">
<div className="mb-2 flex w-full items-center justify-end p-2">
<h2 className="text-2xl font-semibold mr-4">{personal.username} Details</h2>
</div>

  <section className="rounded-2xl bg-white px-4 py-2 shadow-sm">
    {fields.map(({ label, key }) => (
      <div key={key} className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {isEditing ? (
          <input
            name={key}
            value={personal[key]}
            onChange={handleChange}
            className="w-48 rounded-lg border px-3 py-2 text-sm"
          />
        ) : (
          <p className="text-sm font-medium">{personal[key]}</p>
        )}
      </div>
    ))}

    <div className="mt-4 flex justify-end">
      <button
        onClick={handleEditToggle}
        disabled={isSaving}
        className="rounded-xl bg-brand px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Edit"}
      </button>
    </div>
  </section>

  <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
    <div className="mb-3 flex justify-between">
      <span>Credit Limit</span>
      <div className="flex items-center gap-4">
        <button onClick={refreshCreditLimit}>⟳</button>
        <p>Ksh {financials.creditLimit.toLocaleString()}</p>
      </div>
    </div>

    <div className="mb-3 flex justify-between">
      <span>Loan Balance</span>
      <p>Ksh {financials.loanBalance.toLocaleString()}</p>
    </div>

    <div className="mb-3 flex justify-between">
      <span>Total Savings</span>
      <p>Ksh {financials.savings.toLocaleString()}</p>
    </div>

    <div className="mt-6">
      <div className="mb-2 flex justify-between">
        <span>Financial Health</span>
        <span>{financialHealth}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${financialHealth}%` }}
        />
      </div>
    </div>
  </section>

  <Footer />
</div>


);
}