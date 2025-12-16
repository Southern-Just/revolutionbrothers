"use client";

import { useState } from "react";

const QUICK_AMOUNTS = [1000, 500, 300, 100] as const;

type Mode = "deposit" | "withdraw";

export default function DepositWithdraw() {
  const [mode, setMode] = useState<Mode>("deposit");
  const [amount, setAmount] = useState<string>("");
  const [alreadyDeposited, setAlreadyDeposited] = useState(false);
  const [mpesaCode, setMpesaCode] = useState<string>("");

  const handleQuickAmount = (value: number) => {
    setAmount(String(value));
  };

  const handleSubmit = () => {
    const payload = {
      mode,
      amount,
      mpesaCode: alreadyDeposited ? mpesaCode : null,
    };

    console.log(payload);
  };

  return (
    <div className="max-w-md mx-auto rounded-xl border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex rounded-lg overflow-hidden border border-gray-200">
        <button
          onClick={() => setMode("deposit")}
          className={`flex-1 py-2 text-sm font-medium transition ${
            mode === "deposit"
              ? "bg-brand text-white"
              : "bg-gray-50 text-gray-600"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setMode("withdraw")}
          className={`flex-1 py-2 text-sm font-medium transition ${
            mode === "withdraw"
              ? "bg-brand text-white"
              : "bg-gray-50 text-gray-600"
          }`}
        >
          Withdraw
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK_AMOUNTS.map((value) => (
          <button
            key={value}
            onClick={() => handleQuickAmount(value)}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition ${
              amount === String(value)
                ? "border-brand bg-brand/10 text-brand"
                : "border-gray-200 text-gray-700"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div>
        <input
          type="number"
          placeholder="custom amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      {mode === "deposit" && (
        <div className="space-y-2">
          <div className=" flex justify-between">
            <p className="text-sm ml-6">a/c 0741420123</p>
            <button
              onClick={() => setAlreadyDeposited((v) => !v)}
              className="text-sm text-brand underline"
            >
              Already deposited?
            </button>
          </div>

          {alreadyDeposited && (
            <input
              type="text"
              placeholder="Enter M-Pesa code or paste SMS"
              value={mpesaCode}
              onChange={(e) => setMpesaCode(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!amount}
        className="w-full rounded-md bg-brand py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {mode === "deposit" ? "Confirm Deposit" : "Confirm Withdraw"}
      </button>
    </div>
  );
}
