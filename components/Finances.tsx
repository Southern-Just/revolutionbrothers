"use client";

import AccountCard from "./AccountCard";
import Footer from "./Footer";
import Transactions from "./Transactions";
import { useState, useEffect } from "react";
import { getMyProfile, getMyTransactions } from "@/lib/actions/user.systeme";
import { useRouter } from "next/navigation";
import Image from "next/image";

const Finances = () => {
  const [showTransactions, setShowTransactions] = useState(false);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [monthlyContributions, setMonthlyContributions] = useState<
    { month: string; amount: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const profile = await getMyProfile();
        const transactions = await getMyTransactions();

        if (!profile) {
          setLoading(false);
          return;
        }

        setUserName(profile.name);
        setUserEmail(profile.email);

        const credits = transactions.filter((t) => t.type === "credit");

        const monthMap = new Map<string, number>();
        for (const tx of credits) {
          monthMap.set(tx.month, (monthMap.get(tx.month) ?? 0) + tx.amount);
        }

        setMonthlyContributions(
          Array.from(monthMap.entries()).map(([month, amount]) => ({
            month,
            amount,
          }))
        );
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-400 bg-gray-50">
        <Image
          src="/icons/loader1.svg"
          alt="Loading"
          width={220}
          height={220}
          className="animate-spin"
        />
        <p className="text-gray-700 text-sm">In a Sec Big Man</p>
      </div>
    );
  }

  if (!monthlyContributions.length) {
    return (
      <main className="min-h-screen flex flex-col justify-center items-center py-2 space-y-80">
        <div className="space-y-6">
          <h1 className="text-brand text-shadow-amber-300 text-4xl text-bold text-center">
            OOPs G !!! <br /> 🤥
          </h1>
          <p className="text-gray-500 text-center mt-4">
            No Financial data found for G: <br />
            <span className="text-brand text-xl">{userName || userEmail}</span>
          </p>
          <button
            className="absolute bottom-60 right-15 bg-white border-t border-t-gray-300 shadow-lg shadow-gray-400 p-4 py-2 text-xs rounded-lg"
            onClick={() => {
              router.push("/revolution");
            }}
          >
            Start Your Journey
          </button>
        </div>
        <Footer />
      </main>
    );
  }

  const totalSavings = monthlyContributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const averageMonthly = Math.round(totalSavings / monthlyContributions.length);

  const latestMonth =
    monthlyContributions[monthlyContributions.length - 1].month;

  const asOfDate = new Date(`${latestMonth}-01`).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const username = userName.split(" ")[0];

  return (
    <main className="min-h-screen text-foreground px-4 py-4 space-y-3 page-animate">
      <h1 className="text-2xl indent-4 font-bold">Mine Finances</h1>
      <p className="text-[12px] text-center text-gray-500">
        personalization done to perfection by revolution engine
      </p>

      <div className="w-[90%] mx-auto">
        <AccountCard
          fullName={userName}
          username={username}
          balance={totalSavings}
          accountMask="5678"
          linkHref="/finances"
        />
      </div>

      <section className="space-y-2">
        <p className="text-sm font-semibold text-gray-500 text-end mr-6">
          As of {asOfDate}
        </p>

        <div className="px-4 py-2 rounded-xl flex justify-between pr-4 gap-4 items-center">
          <p className="text-md text-center">Monthly Average </p>
          <p className="text-xl text-brand font-semibold text-center">
            KSh {averageMonthly.toLocaleString("en-KE")}
          </p>
        </div>
      </section>

      <section className="bg-white/5 px-4 py-2 rounded-xl space-y-4">
        <p className="text-md text-brand">Monthly Contributions</p>

        <div className="space-y-3">
          {monthlyContributions
            .slice()
            .reverse()
            .map((entry) => (
              <div
                key={entry.month}
                className="flex justify-between items-center border-b border-white/10 pb-2 last:border-none"
              >
                <p className="text-sm text-gray-400">
                  {new Date(`${entry.month}-01`).toLocaleString("en-KE", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="font-semibold">
                  KSh {entry.amount.toLocaleString("en-KE")}
                </p>
              </div>
            ))}
        </div>

        <div className="flex justify-end">
          <button
            className="border border-brand bg-brand/10 rounded-lg p-1"
            onClick={() => setShowTransactions(true)}
          >
            My Transactions
          </button>
        </div>

        {showTransactions && (
          <Transactions onClose={() => setShowTransactions(false)} />
        )}
      </section>

      <Footer />
    </main>
  );
};

export default Finances;