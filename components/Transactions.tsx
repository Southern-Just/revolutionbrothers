"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import {
  getAllTransactions,
  getMyTransactions,
  createTransaction,
} from "@/lib/actions/user.transactions";
import {
  updateTransactionStatus,
  uploadTransactionsCSV,
} from "@/lib/actions/admin.transactions";
import { getAllUsers } from "@/lib/actions/user.systeme";
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

type MemberDTO = {
  userId: string;
  name: string;
  role: string;
  username: string | null;
  phone: string | null;
  profileImage: string | null;
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "decimal",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const CategoryBadge = ({ category }: { category: string }) => {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-gray-200 text-gray-600 border-gray-200";
      case "verified":
        return "bg-green-100 text-green-800 border-green-300";
      case "declined":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${getStatusStyles(category)}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-current" />
      <span className="text-[10px] sm:text-xs font-medium">
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    </div>
  );
};

export default function Transactions({
  onClose,
  userId,
  userRole,
}: TransactionsProps) {
  const [closing, setClosing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [users, setUsers] = useState<MemberDTO[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    userId: "",
    amount: "",
    type: "credit" as "credit" | "debit",
    status: "pending" as "pending" | "verified" | "declined",
    category: "",
    transactionCode: "",
    occurredAt: "",
  });

  const isPersonalView = Boolean(userId);
  const isTreasurer = userRole === "treasurer";

  const loadTransactions = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = isPersonalView
        ? await getMyTransactions()
        : await getAllTransactions();
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
        })),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async (): Promise<void> => {
    try {
      const data = await getAllUsers();
      setUsers([
        ...data.others,
        ...Object.values(data.officials).filter(Boolean),
      ]);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  useEffect(() => {
    void loadTransactions();
    if (isTreasurer && !isPersonalView) {
      void loadUsers();
    }
  }, [isPersonalView, isTreasurer]);

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
      ),
    [transactions],
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
      : [
          "Name",
          "Amount",
          "Type",
          "Status",
          "Date",
          "Transaction Code",
          "Category",
        ];

    const csvRows: string[][] = [
      ["REVOLUTION BROTHERS"],
      [`Exported on: ${timestamp}`],
      [],
      headers,
      ...sortedTransactions.map((t) =>
        isPersonalView
          ? [
              t.amount.toString(),
              t.type,
              t.status,
              t.occurredAt,
              t.transactionCode,
              t.category,
            ]
          : [
              `"${t.name}"`,
              t.amount.toString(),
              t.type,
              t.status,
              t.occurredAt,
              t.transactionCode,
              t.category,
            ],
      ),
    ];

    const csvString =
      "data:text/csv;charset=utf-8," +
      csvRows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvString);
    link.download = "transactions.csv";
    link.click();
  };

  const handleStatusUpdate = (
    transactionId: string,
    newStatus: "verified" | "declined",
  ) => {
    startTransition(async () => {
      try {
        await updateTransactionStatus(transactionId, newStatus);
        toast.success(`Transaction ${newStatus} successfully.`);
        setSelectedTransactionId(null);
        await loadTransactions();
      } catch (error) {
        toast.error("Failed to update transaction status.");
        console.error(error);
      }
    });
  };

  const handleRowClick = (transaction: Transaction) => {
    if (isTreasurer && transaction.status === "pending") {
      setSelectedTransactionId(
        selectedTransactionId === transaction.id ? null : transaction.id,
      );
    }
  };

  const handleCreateTransaction = () => {
    if (
      !newTransaction.userId ||
      !newTransaction.amount ||
      !newTransaction.transactionCode ||
      !newTransaction.occurredAt
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const occurredDate = new Date(newTransaction.occurredAt);
    const month = occurredDate.toISOString().slice(0, 7); // YYYY-MM
    startTransition(async () => {
      try {
        await createTransaction({
          userId: newTransaction.userId,
          month,
          amount: parseFloat(newTransaction.amount),
          type: newTransaction.type,
          category: newTransaction.category,
          transactionCode: newTransaction.transactionCode,
          occurredAt: occurredDate,
        });
        toast.success("Transaction created successfully.");
        setNewTransaction({
          userId: "",
          amount: "",
          type: "credit",
          status: "pending",
          category: "",
          transactionCode: "",
          occurredAt: "",
        });
        setShowAddRow(false);
        await loadTransactions();
      } catch (error) {
        toast.error("Failed to create transaction.");
        console.error(error);
      }
    });
  };

  const handleCancel = () => {
    setNewTransaction({
      userId: "",
      amount: "",
      type: "credit",
      status: "pending",
      category: "",
      transactionCode: "",
      occurredAt: "",
    });
    setShowAddRow(false);
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
      className={`fixed inset-0 z-50 bg-white p-4 ${
        closing ? "modal-slide-down" : "modal-slide-up"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold ml-4">
          {isPersonalView ? "My Transactions" : "All Transactions"}
        </h2>
        <button
          onClick={handleClose}
          className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
        >
          Close
        </button>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-80px)] rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {!isPersonalView && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Transaction Code
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Month
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTransactions.map((t, i) => {
              const isDebit = t.type === "debit";
              const date = new Date(t.occurredAt);
              const currentMonth = date.toLocaleString("en-GB", {
                month: "long",
                year: "numeric",
              });
              const showMonth =
                i === 0 ||
                currentMonth !==
                  new Date(sortedTransactions[i - 1].occurredAt).toLocaleString(
                    "en-GB",
                    {
                      month: "long",
                      year: "numeric",
                    },
                  );
              const isClickable = isTreasurer && t.status === "pending";

              return (
                <React.Fragment key={t.id}>
                  <tr
                    className={`${isDebit ? "bg-red-50" : "bg-green-50"} ${
                      isClickable ? "cursor-pointer hover:bg-gray-100" : ""
                    }`}
                    onClick={() => handleRowClick(t)}
                  >
                    {!isPersonalView && (
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {t.name}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold ${
                          isDebit ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isDebit ? "-" : "+"} KSh {formatAmount(t.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={t.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {t.transactionCode}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <CategoryBadge category={t.category} />
                    </td>
                    <td className="px-6 py-4 text-[9px] text-gray-400">
                      {showMonth ? currentMonth : ""}
                    </td>
                  </tr>
                  {selectedTransactionId === t.id &&
                    isTreasurer &&
                    t.status === "pending" && (
                      <tr>
                        <td
                          colSpan={isPersonalView ? 6 : 7}
                          className="px-6 py-2 bg-gray-50"
                        >
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleStatusUpdate(t.id, "declined")
                              }
                              disabled={isPending}
                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() =>
                                handleStatusUpdate(t.id, "verified")
                              }
                              disabled={isPending}
                              className="px-3 py-1 text-xs bg-brand text-white rounded hover:bg-green-600 disabled:opacity-50"
                            >
                              Verify
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              );
            })}
            {showAddRow && isTreasurer && !isPersonalView && (
              <tr className="bg-blue-50">
                {!isPersonalView && (
                  <td className="px-6 py-4">
                    <select
                      value={newTransaction.userId}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          userId: e.target.value,
                        })
                      }
                      className="w-full px-2 py-1 border rounded-lg text-sm"
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.userId} value={user.userId}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        amount: e.target.value,
                      })
                    }
                    placeholder="Amount"
                    className="w-full px-2 py-1 border rounded-lg text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={newTransaction.status}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        status: e.target.value as
                          | "pending"
                          | "verified"
                          | "declined",
                      })
                    }
                    className="w-full px-1 py-1 border oultine-brand rounded-2xl text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="declined">Declined</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="datetime-local"
                    value={newTransaction.occurredAt}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        occurredAt: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 border outline-none rounded text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={newTransaction.transactionCode}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        transactionCode: e.target.value,
                      })
                    }
                    placeholder="Transaction Code"
                    className="w-full px-1 py-1 border outline-none rounded text-sm"
                  />
                </td>
                <td className="hidden md:table-cell px-6 py-4">
                  <input
                    type="text"
                    value={newTransaction.category}
                    onChange={(e) =>
                      setNewTransaction({
                        ...newTransaction,
                        category: e.target.value,
                      })
                    }
                    placeholder="Category"
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </td>
                <td className="px-6 py-4 text-[9px] text-gray-400">
                  {newTransaction.occurredAt
                    ? new Date(newTransaction.occurredAt).toLocaleString(
                        "en-GB",
                        { month: "long", year: "numeric" },
                      )
                    : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
      </div>

      <div className="fixed bottom-4 left-4 right-4 flex flex-col space-y-4 justify-between items-center bg-white border-t border-gray-200 p-4">
        <div className="flex justify-end items-center gap-18">
          {isTreasurer && !isPersonalView && (
            <>
              <button
                onClick={() => setShowAddRow(!showAddRow)}
                className="px-4 py-2 bg-brand rounded-full text-white  hover:bg-brand/80"
              >
                +
              </button>
              {showAddRow && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTransaction}
                    disabled={isPending}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isTreasurer && !isPersonalView && (
            <label className="px-4 py-2 rounded-full border bg-red-50 border-red-400 text-gray-500 cursor-pointer">
              {isPending ? "Uploading..." : "Upload CSV"}
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append("file", file);
                    startTransition(async () => {
                      try {
                        await uploadTransactionsCSV(formData);
                        toast.success("CSV uploaded successfully.");
                        await loadTransactions();
                      } catch (error) {
                        toast.error("Failed to upload CSV.");
                        console.error(error);
                      }
                    });
                  }
                }}
              />
            </label>
          )}
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-full bg-green-50 border border-brand text-brand hover:bg-brand/80"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
