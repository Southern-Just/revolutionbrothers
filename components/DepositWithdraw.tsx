"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { MyProfile } from "@/lib/actions/user.systeme";
import {
  createTransaction,
  initiateDeposit,
} from "@/lib/actions/user.transactions";

const QUICK_AMOUNTS = [1000, 500, 300, 100] as const;
type Mode = "deposit" | "withdraw";

interface DepositWithdrawProps {
  userProfile: MyProfile | null;
  treasurerPhone: string;
}

function parseAmount(value: string): number | null {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export default function DepositWithdraw({
  userProfile,
  treasurerPhone,
}: DepositWithdrawProps) {
  const [mode, setMode] = useState<Mode>("deposit");
  const [amount, setAmount] = useState("");
  const [alreadyDeposited, setAlreadyDeposited] = useState(false);
  const [mpesaCode, setMpesaCode] = useState("");

  const [isPending, startTransition] = useTransition();

  const isTreasurer = userProfile?.role === "treasurer";

  const handleSubmit = () => {
    if (mode === "withdraw" && !isTreasurer) {
      toast.error("Only the treasurer can withdraw funds.");
      return;
    }

    const parsedAmount = parseAmount(amount);
    if (!parsedAmount) {
      toast.error("Enter a valid amount");
      return;
    }

    if (mode === "deposit" && alreadyDeposited && !mpesaCode.trim()) {
      toast.error("Enter M-Pesa transaction code");
      return;
    }

    startTransition(async () => {
      try {
        /* ---------------- MANUAL DEPOSIT ---------------- */
        if (mode === "deposit" && alreadyDeposited) {
          await createTransaction({
            month: new Date().toISOString().slice(0, 7),
            amount: parsedAmount,
            type: "credit",
            category: "mpesa-manual",
            transactionCode: mpesaCode.trim(),
            occurredAt: new Date(),
          });

          toast.success("Deposit submitted for verification");
        }

        /* ---------------- STK PUSH ---------------- */
        if (mode === "deposit" && !alreadyDeposited) {
          await initiateDeposit(parsedAmount);
          toast.success("M-Pesa prompt sent to your phone");
        }

        /* ---------------- WITHDRAW (PLACEHOLDER) ---------------- */
        if (mode === "withdraw" && isTreasurer) {
          toast.success("Withdrawal processed");
        }

        setAmount("");
        setMpesaCode("");
        setAlreadyDeposited(false);
      } catch (err: unknown) {
        toast.error(
          isError(err) ? err.message : "Something went wrong. Try again."
        );
      }
    });
  };

  const canAccessForm =
    mode === "deposit" || (mode === "withdraw" && isTreasurer);

  return (
    <div className="max-w-md mx-auto rounded-xl border border-gray-200 bg-white p-4 space-y-4">
      {/* MODE SWITCH */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        {(["deposit", "withdraw"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-sm font-medium transition ${
              mode === m ? "bg-brand text-white" : "bg-gray-50 text-gray-600"
            }`}
          >
            {m === "deposit" ? "Deposit" : "Withdraw"}
          </button>
        ))}
      </div>

      {/* NON-TREASURER MESSAGE */}
      {mode === "withdraw" && !isTreasurer && (
        <div className="text-center text-red-300 text-sm bg-red-50 p-3 rounded-md">
          Only the treasurer can withdraw. Contact:
          <a
            href={`tel:${treasurerPhone}`}
            className="ml-1 text-foreground hover:text-red-500"
          >
            {treasurerPhone}
          </a>
        </div>
      )}

      {canAccessForm && (
        <>
          {/* QUICK AMOUNTS */}
          <div className="flex gap-2 flex-wrap">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className={`px-4 py-2 rounded-md text-sm font-medium border ${
                  amount === String(v)
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* AMOUNT */}
          <input
            type="number"
            min={1}
            placeholder="Custom amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          {/* DEPOSIT OPTIONS */}
          {mode === "deposit" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-sm ml-6">Paybill: 0741420123</p>
                <button
                  type="button"
                  onClick={() => setAlreadyDeposited((v) => !v)}
                  className="text-sm text-brand underline"
                >
                  Already deposited?
                </button>
              </div>

              {alreadyDeposited && (
                <input
                  type="text"
                  placeholder="Paste M-Pesa code"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              )}
            </div>
          )}

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={isPending || !amount}
            className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isPending
              ? "Processing..."
              : mode === "deposit"
              ? "Confirm Deposit"
              : "Confirm Withdraw"}
          </button>
        </>
      )}
    </div>
  );
}
