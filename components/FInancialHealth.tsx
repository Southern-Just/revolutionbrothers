"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMyTotalBalance } from "@/lib/actions/user.transactions";

function FinancialSkeleton() {
  return <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />;
}

const FinancialHealth = () => {
  const [totalSavings, setTotalSavings] = useState<number | null>(null);
  const [arrears, setArrears] = useState<number | null>(null);
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [financialHealth, setFinancialHealth] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFinancials() {
      try {
        const savings = await getMyTotalBalance();
        if (!mounted) return;
        const startDate = new Date(2025, 3, 28); 
        const now = new Date();
        const monthsElapsed = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
        const expectedArrears = monthsElapsed * 1000;
        const calculatedArrears = Math.max(0, expectedArrears - savings);

        // Credit limit
        const calculatedCreditLimit = savings * 1.25;

        const calculatedHealth = expectedArrears > 0 ? Math.min(100, Math.round((savings / expectedArrears) * 100)) : 100;

        setTotalSavings(savings);
        setArrears(calculatedArrears);
        setCreditLimit(calculatedCreditLimit);
        setFinancialHealth(calculatedHealth);
        setIsLoaded(true);
      } catch {
        toast.error("Failed to load financial details");
      }
    }

    loadFinancials();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex justify-between">
          <span>Credit Limit</span>
          {!isLoaded ? (
            <FinancialSkeleton />
          ) : (
            <p>Ksh {creditLimit?.toLocaleString() ?? 0}</p>
          )}
        </div>

        <div className="mb-3 flex justify-between">
          <span>Arrears</span>
          {!isLoaded ? (
            <FinancialSkeleton />
          ) : (
            <p>Ksh {arrears?.toLocaleString() ?? 0}</p>
          )}
        </div>

        <div className="mb-3 flex justify-between">
          <span>Total Savings</span>
          {!isLoaded ? (
            <FinancialSkeleton />
          ) : (
            <p>Ksh {totalSavings?.toLocaleString() ?? 0}</p>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <span>Financial Health</span>
            {!isLoaded ? (
              <FinancialSkeleton />
            ) : (
              <span>{financialHealth ?? 0}%</span>
            )}
          </div>

          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${financialHealth ?? 0}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default FinancialHealth;
