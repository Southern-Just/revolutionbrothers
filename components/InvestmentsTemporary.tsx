"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  voteOnInvestment,
  approveInvestment,
  getInvestments,
} from "@/lib/actions/investment.actions";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { OFFICIAL_ROLES } from "@/lib/utils/utils";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CurrentUser {
  id: string;
  role: "chairperson" | "secretary" | "treasurer" | "member";
}

interface SuggestedProject {
  id: string;
  name: string;
  votes: number;
  hasVoted: boolean;
  status: "suggested" | "approved" | "active" | "completed";
}

const END_DATE = new Date("2026-03-06T00:00:00");

export default function InvestmentsTemporary() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [project, setProject] = useState<SuggestedProject | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const investments = await getInvestments();
      const seasonal = investments.find(
        (inv: SuggestedProject) =>
          inv.name.toLowerCase() === "seasonal farming",
      );
      if (seasonal) {
        setProject(seasonal);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = END_DATE.getTime() - now.getTime();
      if (difference <= 0) {
        clearInterval(interval);
        router.push("/revolution");
        return;
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const handleVote = async () => {
    if (!project) return;
    const result = await voteOnInvestment({ investmentId: project.id });
    setProject({
      ...project,
      votes: result.votes,
      hasVoted: result.hasVoted,
    });
  };

  const handleApprove = async () => {
    if (!project || !currentUser) return;
    const result = await approveInvestment({ investmentId: project.id });
    if (result.success) {
      const investments = await getInvestments();
      const seasonal = investments.find(
        (inv: SuggestedProject) => inv.id === project.id,
      );
      if (seasonal) setProject(seasonal);
    }
  };

  const handleProceed = () => {
    if (project?.status === "approved") {
      router.push("/revolution");
    }
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files) return;
    setAttachments(Array.from(event.target.files));
  };

  if (loading || !project) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-brand">Seasonal Farming</h2>
        <p>investment...</p>
      </main>
    );
  }

  const progress = Math.min(project.votes * 10, 100);

  return (
    <main className="min-h-screen px-4 py-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Seasonal Farming
          </h1>
          {timeLeft && (
            <p className="text-brand font-semibold text-sm">
              Closes in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
              {timeLeft.seconds}s
            </p>
          )}
        </div>

        <div className="relative w-full h-72 rounded-2xl overflow-hidden">
          <Image
            src="/images/farm.jpg"
            alt="Seasonal Farming"
            fill
            className="object-cover"
          />
        </div>

        <section className="rounded-2xl bg-white/5 border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Project Steps</h2>
          <ol className="list-decimal list-inside text-sm space-y-2 text-gray-300">
            <li>Planning and land preparation</li>
            <li>Input procurement and logistics</li>
            <li>Planting and irrigation management</li>
            <li>Overseas market linkage</li>
            <li>Harvesting and distribution</li>
          </ol>
        </section>

        <section className="rounded-2xl bg-white/5 border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Attachments</h2>
          <input
            type="file"
            multiple
            onChange={handleAttachmentChange}
            className="text-sm"
          />
          <div className="text-xs text-gray-400">
            {attachments.length} file(s) selected
          </div>
        </section>

        <section className="rounded-2xl bg-white/5 border p-6 space-y-4">
          <h2 className="font-semibold text-lg">Investment Amount</h2>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in KES"
            className="w-full p-3 rounded-xl border bg-white/10 text-sm"
          />
        </section>

        <section className="rounded-2xl bg-white/5 border p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span>Votes</span>
            <span className="font-semibold">{project.votes}</span>
          </div>

          <div className="h-3 rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleVote}
              className={`flex-1 py-2 rounded-xl ${
                project.hasVoted
                  ? "bg-brand text-white"
                  : "border border-brand text-brand"
              }`}
            >
              {project.hasVoted ? "Voted" : "Vote"}
            </button>

            {currentUser &&
              OFFICIAL_ROLES.includes(
                currentUser.role as
                  | "chairperson"
                  | "secretary"
                  | "treasurer",
              ) && (
                <button
                  onClick={handleApprove}
                  className="flex-1 py-2 rounded-xl bg-blue-600 text-white"
                >
                  Approve
                </button>
              )}
          </div>
        </section>

        <button
          disabled={project.status !== "approved"}
          onClick={handleProceed}
          className={`w-full py-3 rounded-2xl font-semibold transition ${
            project.status === "approved"
              ? "bg-brand text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Proceed to Revolution
        </button>
      </div>
    </main>
  );
}