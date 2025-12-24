"use client";

import { useEffect, useState } from "react";
import Footer from "./Footer";

type MemberProfile = {
  id: string;
  userId: string;
  role: "chairperson" | "secretary" | "treasurer" | "member";
  isActive: boolean;
  name: string;
  username: string;
  phone?: string;
  profileImage?: string | null;
  nationalId: string;
  contributions: { amount: string }[];
};

const Profile = () => {
  const [currentUser, setCurrentUser] = useState<MemberProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    nationalId: "",
  });
  const [creditLimit, setCreditLimit] = useState(100000);

  useEffect(() => {
    const cachedUser = sessionStorage.getItem("currentUser");
    if (cachedUser) {
      const data: MemberProfile = JSON.parse(cachedUser);
      setTimeout(() => {
        setCurrentUser(data);
        setPersonal({
          name: data.name,
          email: "",
          phone: data.phone ?? "",
          username: data.username,
          nationalId: data.nationalId,
        });
      }, 0);
      return;
    }

    const load = async () => {
      const membersRes = await fetch("/api/members");
      if (!membersRes.ok) return;

      const members = await membersRes.json();
      if (!members.length) return;

      const memberRes = await fetch(`/api/members/${members[0].id}`);
      if (!memberRes.ok) return;

      const data: MemberProfile = await memberRes.json();
      setCurrentUser(data);
      setPersonal({
        name: data.name,
        email: "",
        phone: data.phone ?? "",
        username: data.username,
        nationalId: data.nationalId,
      });
      sessionStorage.setItem("currentUser", JSON.stringify(data));
    };

    load();
  }, []);

  const totalSavings =
    currentUser?.contributions.reduce((sum, c) => sum + Number(c.amount), 0) ?? 0;

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
    setPersonal((p) => ({ ...p, [name]: value }));
  };

  const refreshCreditLimit = () => {
    setCreditLimit(Math.floor(Math.random() * 200000) + 50000);
  };

  const handleAction = () => {
    setIsEditing(!isEditing);
  };

  const fields = [
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
          {currentUser ? personal.username : "Loading..."} Details
        </h2>
      </div>

      <section className="rounded-2xl bg-white px-4 py-2 shadow-sm">
        {fields.map(({ label, key }) => (
          <div key={key} className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-500">{label}</span>
            {isEditing ? (
              <input
                name={key}
                value={personal[key as keyof typeof personal]}
                onChange={handleChange}
                className="w-48 rounded-lg border px-3 py-2 text-sm"
              />
            ) : currentUser ? (
              <p className="text-sm font-medium">
                {personal[key as keyof typeof personal]}
              </p>
            ) : (
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            )}
          </div>
        ))}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAction}
            className="rounded-xl bg-brand px-6 py-2 text-sm font-semibold text-white"
          >
            {isEditing ? "Save Changes" : "Edit"}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex justify-between">
          <span>Credit Limit</span>
          <div className="flex gap-4 items-center">
            <button onClick={refreshCreditLimit}>⟳</button>
            {currentUser ? (
              <p>ksh {financials.creditLimit.toLocaleString()}</p>
            ) : (
              <div className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse" />
            )}
          </div>
        </div>

        <div className="mb-3 flex justify-between">
          <span>Loan Balance</span>
          {currentUser ? (
            <p>ksh {financials.loanBalance.toLocaleString()}</p>
          ) : (
            <div className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse" />
          )}
        </div>

        <div className="mb-3 flex justify-between">
          <span>Total Savings</span>
          {currentUser ? (
            <p>ksh {financials.savings.toLocaleString()}</p>
          ) : (
            <div className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse" />
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <span>Financial Health</span>
            {currentUser ? (
              <span>{financialHealth}%</span>
            ) : (
              <div className="inline-block w-10 h-4 bg-gray-200 rounded animate-pulse" />
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-500"
              style={{ width: currentUser ? `${financialHealth}%` : "20%" }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;
