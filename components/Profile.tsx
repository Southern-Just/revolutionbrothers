"use client";

import { useEffect, useState } from "react";
import Footer from "./Footer";
import { getCurrentUser } from "@/lib/user.actions";
import { getMemberById, updateMember, MemberRole } from "@/lib/users.systeme";

type Contribution = {
  id: string;
  month?: string | null;
  amount: string | number;
  type: "credit" | "debit";
  status: string;
  category: string;
  transactionCode: string;
  occurredAt: string | Date;
  createdAt?: string | Date | null;
};

type MemberProfile = {
  id: string;
  email: string;
  role: MemberRole;
  name: string;
  username: string;
  nationalId: string;
  phone?: string | null;
  profileImage?: string | null;
  createdAt: string | Date;
  contributions: Contribution[];
};

export default function Profile() {
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    nationalId: "",
  });

  const [creditLimit, setCreditLimit] = useState(100_000);

  useEffect(() => {
    const load = async () => {
      try {
        const auth = await getCurrentUser();
        if (!auth) return;

        const data = (await getMemberById(auth.id)) as MemberProfile;

        setMember(data);
        setPersonal({
          name: data.name,
          email: data.email,
          phone: data.phone ?? "",
          username: data.username,
          nationalId: data.nationalId,
        });
      } catch (err) {
        setError("Failed to load profile.");
        console.error(err);
      }
    };

    load();
  }, []);

  const totalSavings =
    member?.contributions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    ) ?? 0;

  const financials = {
    creditLimit,
    loanBalance: 25_000,
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

  const handleEditToggle = async () => {
    if (isEditing) {
      setIsSaving(true);
      setError(null);
      try {
        if (!member) throw new Error("No member data");
        await updateMember(member.id, {
          name: personal.name,
          username: personal.username,
          phone: personal.phone,
        });
        const updated = await getMemberById(member.id);
        setMember(updated as MemberProfile);
        setPersonal({
          name: updated.name,
          email: updated.email,
          phone: updated.phone ?? "",
          username: updated.username,
          nationalId: updated.nationalId,
        });
      } catch (err) {
        setError("Failed to save changes.");
        console.error(err);
        return;
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing((v) => !v);
  };

  const refreshCreditLimit = () => {
    setCreditLimit(Math.floor(Math.random() * 200_000) + 50_000);
  };

  const fields: { label: string; key: keyof typeof personal }[] = [
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone Number", key: "phone" },
    { label: "Username", key: "username" },
    { label: "National ID", key: "nationalId" },
  ];

  return (
    <div className="mx-auto mt-2 w-[94%] max-w-3xl font-sans">
      <div className="mb-2 flex w-full items-center justify-end p-2">
        <h2 className="text-2xl font-semibold mr-4">
          {member ? personal.username : "Loading..."} Details
        </h2>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

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
                disabled={key === "email" || key === "nationalId"}
              />
            ) : member ? (
              <p className="text-sm font-medium">{personal[key]}</p>
            ) : (
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
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
            {member ? (
              <p>Ksh {financials.creditLimit.toLocaleString()}</p>
            ) : (
              <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
            )}
          </div>
        </div>

        <div className="mb-3 flex justify-between">
          <span>Loan Balance</span>
          {member ? (
            <p>Ksh {financials.loanBalance.toLocaleString()}</p>
          ) : (
            <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
            )}
        </div>

        <div className="mb-3 flex justify-between">
          <span>Total Savings</span>
          {member ? (
            <p>Ksh {financials.savings.toLocaleString()}</p>
          ) : (
            <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <span>Financial Health</span>
            {member ? (
              <span>{financialHealth}%</span>
            ) : (
              <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
            )}
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{
                width: member ? `${financialHealth}%` : "20%",
              }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}