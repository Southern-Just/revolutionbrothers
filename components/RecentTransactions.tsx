"use client";

import { mockData } from "@/lib/mock"; // Updated import
import React from "react";

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

export default function RecentTransactions() {
  const transactions = mockData.recentTransactions; // Now using unified mockData

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <caption className="sr-only">Transaction History</caption>
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction Code
            </th>
            <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => {
            const isDebit = transaction.type === "debit";
            const formattedAmount = formatAmount(transaction.amount);

            return (
              <tr
                key={transaction.id}
                className={
                  isDebit || transaction.amount < 0
                    ? "bg-red-50"
                    : "bg-green-50"
                }
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {removeSpecialCharacters(transaction.name)}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-semibold ${
                      isDebit || transaction.amount < 0
                        ? "text-red-600"
                        : "text-green-600"
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