"use client";

import { useEffect, useState } from "react";
import { getRecentTransactionsAllUsers } from "@/lib/actions/user.transactions";
import type { TransactionDTO } from "@/lib/actions/user.transactions";

/* ---------------- TYPES ---------------- */

type ClientTransaction = Omit<
  TransactionDTO,
  "occurredAt" | "createdAt"
> & {
  occurredAt: string;
  createdAt: string;
};

/* ---------------- HELPERS ---------------- */

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);

const removeSpecialCharacters = (text: string) =>
  text.replace(/[^\w\s]/gi, "");

const CategoryBadge = ({ category }: { category: string }) => (
  <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5">
    <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
    <span className="text-[10px] font-medium text-gray-700 sm:text-xs">
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  </div>
);

/* ---------------- COMPONENT ---------------- */

export default function RecentTransactions() {
  const [txs, setTxs] = useState<ClientTransaction[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadTransactions = async () => {
      setLoading(true);
      try {
        const data = await getRecentTransactionsAllUsers(6);

        if (!mounted) return;

        setTxs(
          data.map((t) => ({
            ...t,
            occurredAt: t.occurredAt.toISOString(),
            createdAt: t.createdAt.toISOString(),
          }))
        );
      } catch (err) {
        console.error("Failed to load transactions", err);
        if (mounted) setTxs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTransactions();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------- STATES ---------------- */

  if (!txs) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (!txs.length) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
        No recent transactions
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">
              Member
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">
              Amount
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium uppercase text-gray-500 sm:px-6">
              Status
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500 sm:px-6">
              Date
            </th>
            <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 md:table-cell">
              Transaction Code
            </th>
            <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 md:table-cell">
              Category
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white">
          {txs.map((tx) => {
            const isDebit = tx.type === "debit";

            return (
              <tr
                key={tx.id}
                className={isDebit ? "bg-red-50" : "bg-green-50"}
              >
                <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                  <div className="text-sm font-medium text-gray-900">
                    {removeSpecialCharacters(tx.name)}
                  </div>
                </td>

                <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                  <span
                    className={`text-sm font-semibold ${
                      isDebit ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isDebit ? "-" : "+"}
                    {formatAmount(tx.amount)}
                  </span>
                </td>

                <td className="px-3 py-4 whitespace-nowrap sm:px-6">
                  <CategoryBadge category={tx.status} />
                </td>

                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {formatDateTime(new Date(tx.occurredAt))}
                </td>

                <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-500 md:table-cell">
                  {tx.transactionCode}
                </td>

                <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                  <CategoryBadge category={tx.category} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {loading && (
        <div className="p-2 text-center text-sm text-gray-500">
          Refreshing…
        </div>
      )}
    </div>
  );
}
