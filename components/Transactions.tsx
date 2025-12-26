"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import { getAllTransactions, getMyTransactions } from "@/lib/actions/user.transactions";

interface Transaction {
  id: string;
  userId: string;
  name: string;
  amount: number;
  type: "credit" | "debit";
  status: "pending" | "verified" | "declined";
  category: string;
  transactionCode: string;
  occurredAt: string;
  month: string;
}

const CategoryBadge = ({ category }: { category: string }) => (
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

  const isPersonalView = Boolean(userId);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const data = isPersonalView
        ? await getMyTransactions()
        : await getAllTransactions();

      setTxs(
        data.map((t) => ({
          id: t.id,
          userId: t.userId,
          name: isPersonalView ? "Me" : t.name,
          amount: Number(t.amount),
          type: t.type,
          status: t.status,
          category: t.category,
          transactionCode: t.transactionCode,
          occurredAt: t.occurredAt.toISOString(),
          month: t.month,
        }))
      );

      setLoading(false);
    };

    load();
  }, [isPersonalView]);

  const visibleTxs = useMemo(() => {
    if (!isPersonalView) return txs;
    return txs.filter((t) => t.userId === userId);
  }, [txs, userId, isPersonalView]);

  const sorted = useMemo(
    () =>
      [...visibleTxs].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() -
          new Date(a.occurredAt).getTime()
      ),
    [visibleTxs]
  );

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 500);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
        <Image
          src="/icons/loader1.svg"
          alt="Loading"
          width={220}
          height={220}
          className="animate-spin"
        />
        <p className="text-gray-700 text-sm">
          {isPersonalView ? "My Transactions…" : "All Transactions…"}
        </p>
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
          {isPersonalView ? "My Transactions" : "All Transactions"}
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
              {!isPersonalView && (
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
              <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transaction Code
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {sorted.map((t) => {
              const isDebit = t.type === "debit";

              return (
                <tr key={t.id} className={isDebit ? "bg-red-50" : "bg-green-50"}>
                  {!isPersonalView && (
                    <td className="px-3 sm:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {t.name}
                      </div>
                    </td>
                  )}

                  <td className="px-3 sm:px-6 py-4">
                    <span
                      className={`text-sm font-semibold ${
                        isDebit ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isDebit ? "-" : "+"} KSh
                      {Math.abs(t.amount).toLocaleString("en-KE")}
                    </span>
                  </td>

                  <td className="px-3 sm:px-6 py-4">
                    <CategoryBadge category={t.status} />
                  </td>

                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                    {new Date(t.occurredAt).toLocaleString()}
                  </td>

                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-500">
                    {t.transactionCode}
                  </td>

                  <td className="hidden md:table-cell px-6 py-4">
                    <CategoryBadge category={t.category} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
