"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import AccountCard from "@/components/AccountCard";
import RecentTransactions from "@/components/RecentTransactions";
import DepositWithdraw from "@/components/DepositWithdraw";
import Transactions from "@/components/Transactions";
import Footer from "@/components/Footer";
import {
  getMyProfile,
  getTreasurerPhone,
  type MyProfile,
} from "@/lib/actions/user.systeme";
import { getTotalBalance } from "@/lib/actions/user.transactions"; // Add this import

type Tab = "transactions" | "deposit";

export default function Revolution() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;

  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam === "deposit" ? "deposit" : "transactions"
  );
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<MyProfile | null>(null);
  const [treasurerPhone, setTreasurerPhone] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [accountDate, setAccountDate] = useState<string>("");

  useEffect(() => {
    getTotalBalance().then((balance) => {
      setTotalBalance(balance);

      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      setAccountDate(`${day}-${month}-${year}`);
    });
  }, []);
  // Loading animation for the page
  useEffect(() => {
    const duration = 2000;
    const intervalMs = 30;
    const step = (intervalMs / duration) * 100;

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + step;
        if (next >= 100) {
          clearInterval(interval);
          setLoading(false);
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, []);

  // Fetch profile, treasurer phone, and total balance
  useEffect(() => {
    getMyProfile().then(setUserProfile);
    getTreasurerPhone().then(setTreasurerPhone);
    getTotalBalance().then(setTotalBalance); // Add this
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-50">
        <Image
          src="/icons/loader1.svg"
          alt="Loading"
          width={220}
          height={220}
          className="animate-spin"
        />
        <div className="w-64 bg-gray-200 rounded-full overflow-hidden h-4">
          <div
            className="bg-gray-200 rounded-full overflow-hidden h-4"
            style={{ width: `${progress}%` }}
          />
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
          <p className="text-end mr-4">Account as of {accountDate}</p>
        </div>

        <div className="flex justify-center">
          <AccountCard
            fullName="Revolution Brothers"
            username="Revolution"
            balance={totalBalance} // Use the fetched totalBalance
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
                  onClick={() => setShowAllTransactions(true)}
                >
                  All
                </span>
              </h1>

              {showAllTransactions && (
                <Transactions onClose={() => setShowAllTransactions(false)} />
              )}

              <RecentTransactions />
            </>
          )}

          {activeTab === "deposit" && (
            <DepositWithdraw
              userProfile={userProfile}
              treasurerPhone={treasurerPhone || "N/A"}
            />
          )}
        </div>

        <p className="text-center tracking-wider text-brand text-sm mt-6">
           {userProfile?.username ? userProfile.username : "mwãna"} akĩrí fĩo
        </p>
      </section>

      <Footer />
    </main>
  );
}
