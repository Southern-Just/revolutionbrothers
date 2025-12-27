"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { getAllTransactions, getMyTransactions } from "@/lib/actions/user.transactions";
// import { uploadTransactionsCSV } from "@/lib/actions/admin.transactions";
import { toast } from "sonner";

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

interface TransactionsProps {
  onClose: () => void;
  userId?: string;
  userRole?: string;
  treasurerPhone?: string | null;
  userPhone?: string | null;
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-KE", { style: "decimal", minimumFractionDigits: 2 }).format(Math.abs(amount));

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const CategoryBadge = ({ category }: { category: string }) => (
  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-gray-200 bg-gray-100">
    <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
    <span className="text-[10px] sm:text-xs font-medium text-gray-700">
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </span>
  </div>
);

export default function Transactions({ onClose, userId, userRole }: TransactionsProps) {
  const [closing, setClosing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const isPersonalView = Boolean(userId);
  const isTreasurer = userRole === "treasurer";

  const loadTransactions = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = isPersonalView ? await getMyTransactions() : await getAllTransactions();
      setTransactions(
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, [isPersonalView]);

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()),
    [transactions]
  );

  const handleClose = (): void => {
    setClosing(true);
    setTimeout(onClose, 500);
  };

  const exportCSV = (): void => {
    const timestamp = new Date().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const headers = isPersonalView
      ? ["Amount", "Type", "Status", "Date", "Transaction Code", "Category"]
      : ["Name", "Amount", "Type", "Status", "Date", "Transaction Code", "Category"];

    const csvRows: string[][] = [
      ["REVOLUTION BROTHERS"],
      [`Exported on: ${timestamp}`],
      [],
      headers,
      ...sortedTransactions.map((t) =>
        isPersonalView
          ? [t.amount.toString(), t.type, t.status, t.occurredAt, t.transactionCode, t.category]
          : [`"${t.name}"`, t.amount.toString(), t.type, t.status, t.occurredAt, t.transactionCode, t.category]
      ),
    ];

    const csvString = "data:text/csv;charset=utf-8," + csvRows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvString);
    link.download = "transactions.csv";
    link.click();
  };

  // const handleUpload = (file: File) => {
  //   const formData = new FormData();
  //   formData.append("file", file);

  //   startTransition(async () => {
  //     try {
  //       const res = await uploadTransactionsCSV(formData);
  //       toast.success(`Uploaded ${res.count} transactions`);
  //       await loadTransactions();
  //     } catch {
  //       toast.error("Upload failed");
  //     }
  //   });
  // };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
        <Image src="/icons/loader1.svg" alt="Loading" width={220} height={220} className="animate-spin" />
        <p className="text-gray-700 text-sm">{isPersonalView ? "My Transactions…" : "All Transactions…"}</p>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto bg-white p-4 ${closing ? "modal-slide-down" : "modal-slide-up"}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{isPersonalView ? "My Transactions" : "All Transactions"}</h2>
        <button onClick={handleClose} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">
          Close
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {!isPersonalView && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Code</th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((t, i) => {
              const isDebit = t.type === "debit";
              const date = new Date(t.occurredAt);
              const currentMonth = date.toLocaleString("en-GB", { month: "long", year: "numeric" });
              const showMonth =
                i === 0 ||
                currentMonth !==
                  new Date(sortedTransactions[i - 1].occurredAt).toLocaleString("en-GB", {
                    month: "long",
                    year: "numeric",
                  });

              return (
                <tr key={t.id} className={isDebit ? "bg-red-50" : "bg-green-50"}>
                  {!isPersonalView && (
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                  )}
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${isDebit ? "text-red-600" : "text-green-600"}`}>
                      {isDebit ? "-" : "+"} KSh {formatAmount(t.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <CategoryBadge category={t.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(date)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.transactionCode}</td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <CategoryBadge category={t.category} />
                  </td>
                  <td className="px-6 py-4 text-[9px] text-gray-400">{showMonth ? currentMonth : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4 gap-2">
        {/* {isTreasurer && !isPersonalView && (
          <label className="px-4 py-2 rounded-lg bg-gray-700 text-white cursor-pointer">
            {isPending ? "Uploading..." : "Upload CSV"}
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={(e) => {
     }}
            />
          </label>
        )} */}
                <label className="px-4 py-2 rounded-lg bg-red-100 text-red-400 cursor-pointer">
          <input
            type="file"
            accept=".csv"
            hidden
          />
          Upload CSV
        </label>
        <button onClick={exportCSV} className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/80">
          Download CSV
        </button>
      </div>
    </div>
  );
}
