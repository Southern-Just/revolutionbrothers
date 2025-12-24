"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/users.transactions";

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);

const removeSpecialCharacters = (text: string) =>
  text.replace(/[^\w\s]/gi, "");

interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: "credit" | "debit";
  status: string;
  category: string;
  transactionCode: string;
  occurredAt: string;
}

interface CategoryBadgeProps {
  category: string;
}

const CategoryBadge = ({ category }: CategoryBadgeProps) => (
  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-gray-200 bg-gray-100">
    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
    <span className="text-[10px] sm:text-xs font-medium text-gray-700">
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  </div>
);

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTransactions();

        const recent = data
          .map((t) => ({
            ...t,
            amount: Number(t.amount),
            occurredAt: new Date(t.occurredAt).toISOString(),
            type: t.type as "credit" | "debit",
          }))
          .sort(
            (a, b) =>
              new Date(b.occurredAt).getTime() -
              new Date(a.occurredAt).getTime()
          )
          .slice(0, 6);

        setTransactions(recent);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
        Loading transactions…
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <caption className="sr-only">Transaction History</caption>

        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Name
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Amount
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Transaction Code
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Category
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => {
            const isDebit = transaction.type === "debit";
            const amount = formatAmount(transaction.amount);

            return (
              <tr
                key={transaction.id}
                className={isDebit ? "bg-red-50" : "bg-green-50"}
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {removeSpecialCharacters(transaction.name)}
                  </div>
                </td>

                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-semibold ${
                      isDebit ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {isDebit ? `-${amount}` : `+${amount}`}
                  </span>
                </td>

                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <CategoryBadge category={transaction.status} />
                </td>

                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateTime(new Date(transaction.occurredAt))}
                </td>

                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.transactionCode}
                </td>

                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <CategoryBadge category={transaction.category} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
