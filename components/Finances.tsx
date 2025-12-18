// app/finances/page.tsx (or wherever your Finances component is)
"use client";
import { mockData } from "@/lib/mock";
import AccountCard from "./AccountCard";  // Adjust path as needed
import { useRouter } from "next/navigation";
import Header from "./Header";

const ACTIVE_USER_ID = "1"; // Change or make dynamic as needed

const Finances = () => {
  const router = useRouter();

  const user = mockData.members.find((u) => u.userId === ACTIVE_USER_ID);

  if (!user) {
    return (
      <main className="min-h-screen px-6 py-2">
        <Header />
        <p className="text-gray-500 text-center mt-10">
          No financial data available for this user.
        </p>
      </main>
    );
  }

  const totalSavings = user.contributions.reduce((sum, c) => sum + c.amount, 0);
  const averageMonthly = Math.round(totalSavings / user.contributions.length);

  const latestMonth = user.contributions[user.contributions.length - 1].month;
  const asOfDate = new Date(`${latestMonth}-01`).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Extract first name for username display
  const username = user.name.split(" ")[0];

  return (
    <main className="min-h-screen text-foreground px-4 py-4 space-y-3">
      <h1 className="text-2xl indent-4 font-bold">Mine Finances</h1>
      <p className="text-[11px] text-center text-gray-500">personalization done to perfection by revolution engine</p>

      <div className="w-[90%] mx-auto">
        <AccountCard
          fullName={user.name}
          username={username}
          balance={totalSavings}
          accountMask="5678"
          linkHref="/finances"
        />
      </div>

      <section className="space-y-2">
        <div className="bg-white/5 p-4 space-y-4 rounded-xl">
          <p className="text-md text-brand">Total Savings</p>
          <div className="flex justify-between items-center">
            <p className="text-2xl font-semibold">
              KSh {totalSavings.toLocaleString("en-KE")}
            </p>
            <p className="text-sm font-semibold text-gray-500">
              As of {asOfDate}
            </p>
          </div>
        </div>

        <div className="bg-white/5 px-4 py-2 rounded-xl">
          <p className="text-md text-brand">Average Monthly Contribution</p>
          <p className="text-2xl font-semibold">
            KSh {averageMonthly.toLocaleString("en-KE")}
          </p>
        </div>
      </section>

      <section className="bg-white/5 px-4 py-2 rounded-xl space-y-4">
        <p className="text-md text-brand">Monthly Contributions</p>

        <div className="space-y-3">
          {user.contributions
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
      </section>
    </main>
  );
};

export default Finances;