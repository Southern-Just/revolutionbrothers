"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AccountCard from "@/components/AccountCard";
import RecentTransactions from "@/components/RecentTransactions";
import DepositWithdraw from "@/components/DepositWithdraw";
import { mockData } from "@/lib/mock";
import Footer from "@/components/Footer";
import Transactions from "@/components/Transactions";

type Tab = "transactions" | "deposit";

const totalGroupBalance = mockData.members
  .flatMap((member) => member.contributions)
  .reduce((sum, contrib) => sum + contrib.amount, 0);

export default function Revolution() {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const firstVisit =
    typeof window !== "undefined" &&
    localStorage.getItem("firstVisit") === null;
  const [loading, setLoading] = useState(firstVisit);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const duration = 3000;
    const intervalTime = 30;
    const increments = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increments;
        if (next >= 100) {
          clearInterval(interval);
          setLoading(false);
          localStorage.setItem("firstVisit", "false");
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-start mt-22 h-screen gap-4 bg-gray-50">
        <Image
          src="/icons/loader1.svg"
          alt="Loading..."
          width={220}
          height={220}
          className="animate-spin"
        />
        <div className="w-64 bg-gray-200 rounded-full overflow-hidden h-4">
          <div
            className="h-4 bg-brand transition-all duration-75"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-gray-700 text-sm">
          Welcome: setting you up in a few...
        </p>
      </div>
    );
  }

  return (
    <main>
      <section className="w-[94%] mx-auto items-center justify-center page-animate">
        <div className="space-y-2 mb-8">
          <h1 className="font-bold text-2xl px-4 shadow-lg shadow-brand/40">
            Revolution Brother&apos;s Finances
          </h1>
          <p className="text-end mr-4">Account as of 23-04-2025</p>
        </div>
        <div className="flex justify-center">
          <AccountCard
            fullName="Revolution Brothers"
            username="Revolution"
            balance={totalGroupBalance}
          />
        </div>
        <div className="mt-6">
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2 text-sm rounded-full transition ${
                activeTab === "transactions"
                  ? "bg-gray-400 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Recent Transactions
            </button>
            <button
              onClick={() => setActiveTab("deposit")}
              className={`px-4 py-2 text-sm rounded-full transition ${
                activeTab === "deposit"
                  ? "bg-gray-400 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Deposit | Withdraw
            </button>
          </div>
          {activeTab === "transactions" && (
            <>
              <h1 className="text-[16px] text-foreground text-center mb-2 ml-2">
                Follow up on your money{" "}
                <span
                  className="text-sm ml-2 p-0.5 border rounded-sm cursor-pointer border-red-500"
                  onClick={() => {
                    setShowAllTransactions(true);
                  }}
                >
                  All
                </span>
                {showAllTransactions && (
                  <Transactions onClose={() => setShowAllTransactions(false)} />
                )}
              </h1>
              <RecentTransactions />
            </>
          )}
          {activeTab === "deposit" && (
            <>
              <h1 className="text-[16px] text-foreground text-center mb-2 ml-2">
                Credit or Debit your Account
              </h1>
              <DepositWithdraw />
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
