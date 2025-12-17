"use client";
import Image from "next/image";
import { mockMonthlyContributions } from "@/lib/mock";
import AccountCard from "./AccountCard";
import { useRouter } from "next/navigation";

const ACTIVE_USER_ID = "1";

const Finances = () => {
  const router = useRouter();

  const user = mockMonthlyContributions.find(
    (u) => u.userId === ACTIVE_USER_ID
  );

  if (!user) {
    return (
      <main className="min-h-screen px-6 py-4">
        <p className="text-gray-500">No financial data available.</p>
      </main>
    );
  }

  const totalSavings = user.contributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  return (
    <main className="min-h-screen text-foreground px-6 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-1 rounded hover:bg-white/10"
          aria-label="Go back"
        >
          <Image
            src="/icons/arrow-left.svg"
            alt=""
            width={22}
            height={22}
          />
        </button>

        <h1 className="text-3xl font-bold">Mine Finances</h1>
      </div>

      <AccountCard />

      <section className="space-y-2">
        <div className="bg-white/5 p-4 space-y-4 rounded-xl">
          <p className="text-md text-brand">Total Savings</p>
          <div className="flex justify-between items-center">
            <p className="text-2xl font-semibold">
              KSh {totalSavings.toLocaleString()}
            </p>
            <p className="text-sm font-semibold text-gray-500">
              As of 25-04-2025
            </p>
          </div>
        </div>

        <div className="bg-white/5 px-4 py-2 rounded-xl">
          <p className="text-md text-brand">
            Average Monthly Contribution
          </p>
          <p className="text-2xl font-semibold">
            KSh{" "}
            {Math.round(
              totalSavings / user.contributions.length
            ).toLocaleString()}
          </p>
        </div>
      </section>

      <section className="bg-white/5 px-4 py-2 rounded-xl space-y-4">
        <p className="text-md text-brand">Monthly Contributions</p>

        <div className="space-y-3">
          {user.contributions.map((entry) => (
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
                KSh {entry.amount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Finances;
