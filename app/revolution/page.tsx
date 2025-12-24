"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AccountCard from "@/components/AccountCard";
import RecentTransactions from "@/components/RecentTransactions";
import DepositWithdraw from "@/components/DepositWithdraw";
import Transactions from "@/components/Transactions";
import Footer from "@/components/Footer";
import { getCurrentUser } from "@/lib/user.actions";
import { getTransactions } from "@/lib/users.transactions";

type Tab = "transactions" | "deposit";

interface Member {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  name: string;
  month?: string;
  amount: number;
  type: "credit" | "debit";
  status: string;
  category: string;
  transactionCode: string;
  occurredAt: string;
  createdAt?: string;
}

export default function Revolution() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [member, setMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.replace("/");
          return;
        }
        setMember(user);

        const txs = await getTransactions(user.id);

        // Ensure amount is a number
        const normalizedTxs: Transaction[] = txs.map((t) => ({
          ...t,
          amount: Number(t.amount),
          occurredAt: new Date(t.occurredAt).toISOString(),
        }));

        setTransactions(normalizedTxs);

        const balance = normalizedTxs.reduce((sum, t) => sum + t.amount, 0);
        setTotalBalance(balance);

        setAuthChecked(true);
      } catch {
        router.replace("/");
      }
    };

    init();
  }, [router]);

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

  if (!authChecked || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-50">
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
          <p className="text-end mr-4">Account as of 23-04-2025</p>
        </div>

        <div className="flex justify-center">
          <AccountCard
            fullName="Revolution Brothers"
            username="Revolution"
            balance={totalBalance}
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
                {showAllTransactions && (
                  <Transactions onClose={() => setShowAllTransactions(false)} />
                )}
              </h1>
              <RecentTransactions transactions={transactions.slice(0, 5)} />
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

        {member && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Welcome {member.name}
          </p>
        )}
      </section>

      <Footer />
    </main>
  );
}
