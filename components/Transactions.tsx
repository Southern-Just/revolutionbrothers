"use client";

import { useEffect, useMemo, useState } from "react";
import { mockData } from "@/lib/mock";

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

interface Transaction {
  id: string;
  userId?: string;
  name: string;
  amount: number;
  type: "credit" | "debit";
  status: string;
  category: string;
  transactionCode: string;
  occurredAt: string;
  month?: string;
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

interface TransactionsProps {
  onClose: () => void;
  userId?: string;
}

export default function Transactions({ onClose, userId }: TransactionsProps) {
  const [closing, setClosing] = useState(false);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data: Transaction[] = mockData.recentTransactions.map((t) => ({
        id: t.id,
        userId: undefined,
        name: t.name ?? "",
        amount: t.amount ?? 0,
        type: t.type ?? "credit",
        status: t.status ?? "",
        category: t.category ?? "",
        transactionCode: t.transactionCode ?? "",
        occurredAt: t.date ?? new Date().toISOString(),
      }));

      setTxs(
        data.map((t) => ({
          ...t,
          amount: Number(t.amount) || 0,
          occurredAt: new Date(t.occurredAt).toISOString(),
        }))
      );
      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(
    () => (userId ? txs.filter((t) => t.userId === userId) : txs),
    [txs, userId]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      ),
    [filtered]
  );

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        Loading…
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-white p-4 ${
        closing ? "modal-slide-down" : "modal-slide-up"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {userId ? "My Transactions" : "All Transactions"}
        </h2>
        <button
          onClick={handleClose}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        >
          Close
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {!userId && (
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-10 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transaction Code
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Month
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.map((t, index) => {
              const isDebit = t.type === "debit";
              const amount = formatAmount(t.amount);
              const date = new Date(t.occurredAt);
              const currentMonth = date.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              });

              const showMonth =
                index === 0 ||
                currentMonth !==
                  new Date(sorted[index - 1].occurredAt).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  });

              return (
                <tr key={t.id} className={isDebit ? "bg-red-50" : "bg-green-50"}>
                  {!userId && (
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{t.name}</div>
                    </td>
                  )}
                  <td className="px-3 sm:px-6 py-4">
                    <span
                      className={`text-sm font-semibold ${
                        isDebit ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isDebit ? `-${amount}` : `+${amount}`}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <CategoryBadge category={t.status} />
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                    {formatDateTime(date)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                    {t.transactionCode}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <CategoryBadge category={t.category} />
                  </td>
                  <td className="px-3 sm:px-6 py-4 text-[9px] text-gray-400">
                    {showMonth ? currentMonth : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => {
            const csv =
              "data:text/csv;charset=utf-8," +
              sorted
                .map((t) =>
                  [
                    !userId ? t.name : "",
                    t.amount,
                    t.type,
                    t.status,
                    t.occurredAt,
                    t.transactionCode,
                    t.category,
                  ].join(",")
                )
                .join("\n");

            const link = document.createElement("a");
            link.href = encodeURI(csv);
            link.download = "transactions.csv";
            link.click();
          }}
          className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/80"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}
