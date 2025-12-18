"use client";

import { useState } from "react";
import AccountCard from "@/components/AccountCard";
import Header from "@/components/Header";
import RecentTransactions from "@/components/RecentTransactions";
import DepositWithdraw from "@/components/DepositWithdraw";

type Tab = "transactions" | "deposit";

export default function Revolution() {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");

  return (
    <main>
      <Header />

      <section className="w-[94%] mx-auto items-center justify-center">
        <div className="space-y-2 mb-8 text-shadow-md text-shadow-brand/90">
          <h1 className="font-bold text-2xl px-4 shadow-xl shadow-brand/40">
            Revolution Brother&apos;s Finances
          </h1>
          <p className="text-end mr-4">Account as of 23-04-2025</p>
        </div>

        <div className="flex justify-center">
          <AccountCard />
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
                Follow up on your money <span className="text-sm ml-2 p-0.5 border rounded-sm cursor-pointer border-red-500">All</span>
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
    </main>
  );
}
