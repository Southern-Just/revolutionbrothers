"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { createManualTransaction, searchUsers } from "@/lib/actions/admin.transactions";

interface AddTransactionRowProps {
  onAdded: () => void;
  isPersonalView: boolean;
}

interface NewTransaction {
  userId: string;
  email: string;
  name: string;
  amount: string;
  type: "credit" | "debit";
  category: string;
  transactionCode: string;
  occurredAt: string;
}

interface UserSuggestion {
  id: string;
  email: string;
  name: string | null;
}

export default function AddTransactionRow({ onAdded, isPersonalView }: AddTransactionRowProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    userId: "",
    email: "",
    name: "",
    amount: "",
    type: "credit",
    category: "",
    transactionCode: "",
    occurredAt: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (userQuery.trim().length > 1) {
        try {
          const results = await searchUsers(userQuery);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching user suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [userQuery]);

  const handleUserSelect = (user: UserSuggestion) => {
    setNewTransaction((prev) => ({
      ...prev,
      userId: user.id,
      email: user.email,
      name: user.name || user.email,
    }));
    setUserQuery(user.name || user.email);
    setShowSuggestions(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setUserQuery(value);
      setNewTransaction((prev) => ({ ...prev, userId: "", email: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.userId && !newTransaction.email) {
      toast.error("Please select or enter a user.");
      return;
    }
    if (!newTransaction.amount || !newTransaction.occurredAt) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createManualTransaction({
        userId: newTransaction.userId || undefined,
        email: newTransaction.userId ? undefined : newTransaction.email,
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        status: "pending", // Default to pending
        category: newTransaction.category,
        transactionCode: newTransaction.transactionCode,
        occurredAt: new Date(newTransaction.occurredAt),
      });
      toast.success("Transaction added successfully.");
      setIsAdding(false);
      setNewTransaction({
        userId: "",
        email: "",
        name: "",
        amount: "",
        type: "credit",
        category: "",
        transactionCode: "",
        occurredAt: "",
      });
      setUserQuery("");
      onAdded();
    } catch (error) {
      toast.error("Failed to add transaction.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewTransaction({
      userId: "",
      email: "",
      name: "",
      amount: "",
      type: "credit",
      category: "",
      transactionCode: "",
      occurredAt: "",
    });
    setUserQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  if (!isAdding) {
    return (
      <tr>
        <td colSpan={isPersonalView ? 6 : 7} className="px-6 py-4 text-center">
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center w-10 h-10 bg-brand text-white rounded-full hover:bg-brand/80 transition-colors mx-auto"
            title="Add Transaction"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <React.Fragment>
        <tr className="bg-blue-50">
          {!isPersonalView && (
            <td className="px-6 py-4 relative">
              <input
                type="text"
                name="name"
                value={userQuery}
                onChange={handleInputChange}
                placeholder="Search user by name or email"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto w-full">
                  {suggestions.map((user) => (
                    <li
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {user.name || user.email} ({user.email})
                    </li>
                  ))}
                </ul>
              )}
            </td>
          )}
          <td className="px-6 py-4">
            <input
              type="number"
              name="amount"
              value={newTransaction.amount}
              onChange={handleInputChange}
              placeholder="Amount"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              step="0.01"
              required
            />
          </td>
          <td className="px-6 py-4">
            <select
              name="type"
              value={newTransaction.type}
              onChange={handleInputChange}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </td>
          <td className="px-6 py-4">
            <input
              type="datetime-local"
              name="occurredAt"
              value={newTransaction.occurredAt}
              onChange={handleInputChange}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              required
            />
          </td>
          <td className="px-6 py-4">
            <input
              type="text"
              name="transactionCode"
              value={newTransaction.transactionCode}
              onChange={handleInputChange}
              placeholder="Transaction Code"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </td>
          <td className="hidden md:table-cell px-6 py-4">
            <input
              type="text"
              name="category"
              value={newTransaction.category}
              onChange={handleInputChange}
              placeholder="Category"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </td>
          <td className="px-6 py-4 text-[9px] text-gray-400">
            {/* Month placeholder, can be left empty or auto-filled */}
          </td>
        </tr>
        <tr>
          <td
            colSpan={isPersonalView ? 6 : 7}
            className="px-6 py-2 bg-gray-50"
          >
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      </React.Fragment>
    </form>
  );
}