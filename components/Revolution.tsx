"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
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
import { getTotalBalance } from "@/lib/actions/user.transactions";

type Tab = "transactions" | "deposit";

export default function Revolution() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;

  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam === "deposit" ? "deposit" : "transactions"
  );
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [userProfile, setUserProfile] = useState<MyProfile | null>(null);
  const [treasurerPhone, setTreasurerPhone] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [accountDate, setAccountDate] = useState<string>("");
  const router = useRouter()
  useEffect(() => {
    const fetchData = () => {
      getTotalBalance().then((balance) => {
        setTotalBalance(balance);
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        setAccountDate(`${day}-${month}-${year}`);
      });
      getMyProfile().then(setUserProfile);
      getTreasurerPhone().then(setTreasurerPhone);
    };

    fetchData();

    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main>
      <section className="w-[94%] mx-auto items-center justify-center page-animate">
        <div className="space-y-2 mb-8">
          <div className="flex  shadow-lg shadow-brand/40">
            {" "}
            <h1 className="font-bold text-2xl px-4">
              Revolution Brother&apos;s Finances
            </h1>
            <button
              className="py-2 px-4 cursor-pointer text-md bg-gray-50"
              onClick={() => {router.push("/investments")}}
            >
              🔘 <span className="text-[9px]">investments</span>
            </button>
          </div>
          <p className="text-end mr-4">Account as of {accountDate}</p>
        </div>

        <div className="flex justify-center px-0">
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
              <div className="flex justify-center mb-4 ml-2 gap-3">
                <Image
                  src="/icons/loader.svg"
                  alt="Loading"
                  width={18}
                  height={18}
                  className="opacity-30 "
                />
                <h1 className="text-[16px] text-foreground text-center ">
                  Follow up on your money{" "}
                  <span
                    className="text-sm ml-2 p-0.5 border rounded-sm cursor-pointer border-red-500"
                    onClick={() => setShowAllTransactions(true)}
                  >
                    All
                  </span>
                </h1>
              </div>

              {showAllTransactions && (
                <Transactions
                  onClose={() => setShowAllTransactions(false)}
                  userRole={userProfile?.role}
                />
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