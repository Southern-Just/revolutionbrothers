"use client";

import { useState } from "react";
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

interface CategoryBadgeProps {
  category: string;
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => (
  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-gray-200 bg-gray-100">
    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
    <span className="text-[10px] sm:text-xs font-medium text-gray-700">
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  </div>
);

interface AllTransactionsProps {
  onClose: () => void;
  userId?: string;
}

export default function Transactions({ onClose, userId }: AllTransactionsProps) {
  const [closing, setClosing] = useState(false);

  const transactions = userId
    ? mockData.members
        .filter((member) => member.userId === userId)
        .flatMap((member, idx) =>
          member.contributions.map((c, i) => ({
            id: `${member.userId}-${i}`,
            name: member.name,
            amount: c.amount,
            type: Math.random() > 0.5 ? "credit" : "debit",
            status: "completed",
            date: `${c.month}-01T12:00:00Z`,
            transactionCode: `TRX-${member.userId}-${i}`,
            category: "monthly",
          }))
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : mockData.members
        .flatMap((member) =>
          member.contributions.map((c, i) => ({
            id: `${member.userId}-${i}`,
            name: member.name,
            amount: c.amount,
            type: Math.random() > 0.5 ? "credit" : "debit",
            status: "completed",
            date: `${c.month}-01T12:00:00Z`,
            transactionCode: `TRX-${member.userId}-${i}`,
            category: "monthly",
          }))
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 500);
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-white p-4 ${
        closing ? "modal-slide-down" : "modal-slide-up"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{userId ? "My Transactions" : "All Transactions"}</h2>
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
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction Code
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction, index) => {
              const isDebit = transaction.type === "debit";
              const formattedAmount = formatAmount(transaction.amount);
              const currentMonth = new Date(transaction.date).toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              });
              const showMonth =
                index === 0 ||
                currentMonth !==
                  new Date(transactions[index - 1].date).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  });

              return (
                <tr
                  key={transaction.id}
                  className={isDebit ? "bg-red-50" : "bg-green-50"}
                >
                  {!userId && (
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.name.replace(/[^\w\s]/gi, "")}
                      </div>
                    </td>
                  )}
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-semibold ${
                        isDebit ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isDebit ? `-${formattedAmount}` : `+${formattedAmount}`}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <CategoryBadge category={transaction.status} />
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(new Date(transaction.date))}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.transactionCode}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <CategoryBadge category={transaction.category} />
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-[9px] text-gray-400">
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
            const csvContent =
              "data:text/csv;charset=utf-8," +
              transactions
                .map((t) =>
                  [
                    !userId ? t.name : "",
                    t.amount,
                    t.type,
                    t.status,
                    t.date,
                    t.transactionCode,
                    t.category,
                  ].join(",")
                )
                .join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "transactions.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/80"
        >
          Download CSV
        </button>
      </div>
    </div>
  );
}
