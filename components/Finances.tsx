"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import AccountCard from "./AccountCard";
import Footer from "./Footer";
import Transactions from "./Transactions";

import { getMyProfile } from "@/lib/actions/user.systeme";
import { getMyTransactions } from "@/lib/actions/user.transactions";
import { getCurrentUser } from "@/lib/actions/user.actions"; 

const Finances = () => {
  const [showTransactions, setShowTransactions] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [monthlyContributions, setMonthlyContributions] = useState<
    { month: string; amount: number }[]
  >([]);
  const [userId, setUserId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>(""); 
  const [userPhone, setUserPhone] = useState<string>("");

  const router = useRouter();

  const handleClick = () => {
    router.push("/?tab=deposit");
  };


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const [currentUser, profile, transactions] = await Promise.all([
          getCurrentUser(),
          getMyProfile(),
          getMyTransactions()
        ]);

        if (!profile || !currentUser) return;

        setUserName(profile.name);
        setUserEmail(profile.email);
        setUserId(currentUser.id); 
        setUserRole(profile.role);
        setUserPhone(profile.phone || ""); 

        const credits = transactions.filter(
          (t) => t.type === "credit"
        );

        const monthMap = new Map<string, number>();

        for (const tx of credits) {
          monthMap.set(
            tx.month,
            (monthMap.get(tx.month) ?? 0) + tx.amount
          );
        }

        setMonthlyContributions(
          Array.from(monthMap.entries()).map(
            ([month, amount]) => ({ month, amount })
          )
        );
      } catch (error) {
        console.error("Error loading finances:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-400">
        <Image
          src="/icons/loader1.svg"
          alt="Loading"
          width={220}
          height={220}
          className="animate-spin"
        />
        <p className="text-sm text-gray-700">In a sec big man</p>
      </div>
    );
  }

    // empty state

  if (!monthlyContributions.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center space-y-80 py-2">
        <div className="space-y-6">
          <h1 className="text-center text-4xl font-bold text-brand">
            OOPs G !!! <br /> 🤥
          </h1>

          <p className="mt-4 text-center text-gray-500">
            No financial data found for:
            <br />
            <span className="text-xl text-brand">
              {userName || userEmail}
            </span>
          </p>

          <button
            onClick={handleClick}
            className="absolute bottom-60 right-15 rounded-lg border-t border-gray-300 bg-white px-4 py-2 text-xs shadow-lg"
          >
            Start Your Journey
          </button>
        </div>

        <Footer />
      </main>
    );
  }

// u can move the computations elsewhere

  const totalSavings = monthlyContributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const averageMonthly = Math.round(
    totalSavings / monthlyContributions.length
  );

  const latestMonth =
    monthlyContributions[monthlyContributions.length - 1].month;

  const asOfDate = new Date(`${latestMonth}-01`).toLocaleDateString(
    "en-KE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );

  const username =
    userName.trim().split(" ")[0] ||
    userEmail.split("@")[0];

  return (
    <main className="min-h-screen space-y-3 px-4 py-4 text-foreground page-animate">
      <h1 className="indent-4 text-2xl font-bold">Mine Finances</h1>

      <p className="text-start px-5 text-[12px] text-gray-500">
        personalization powered by revolution engine
      </p>

      <div className="mx-auto w-[90%]">
        <AccountCard
          fullName={userName}
          username={username}
          balance={totalSavings}
          accountMask="5678"
          linkHref="/finances"
        />
      </div>

      <section className="space-y-2">
        <p className="mr-6 text-end text-sm font-semibold text-gray-500">
          As of {asOfDate}
        </p>

        <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-2">
          <p className="text-md">Monthly Average</p>
          <p className="text-xl font-semibold text-brand">
            KSh {averageMonthly.toLocaleString("en-KE")}
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-white/5 px-4 py-2">
        <p className="text-md text-brand">Monthly Contributions</p>

        <div className="space-y-3">
          {monthlyContributions
            .slice()
            .reverse()
            .map((entry) => (
              <div
                key={entry.month}
                className="flex items-center justify-between border-b border-white/10 pb-2 last:border-none"
              >
                <p className="text-sm text-gray-400">
                  {new Date(`${entry.month}-01`).toLocaleString(
                    "en-KE",
                    { month: "long", year: "numeric" }
                  )}
                </p>

                <p className="font-semibold">
                  KSh {entry.amount.toLocaleString("en-KE")}
                </p>
              </div>
            ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowTransactions(true)}
            className="rounded-lg border border-brand bg-brand/10 p-1"
          >
            My Transactions
          </button>
        </div>

        {showTransactions && (
          <Transactions 
            onClose={() => setShowTransactions(false)} 
            userId={userId}
            userRole={userRole} 
            userPhone={userPhone} 
          />
        )}
      </section>

      <Footer />
    </main>
  );
};

export default Finances;
