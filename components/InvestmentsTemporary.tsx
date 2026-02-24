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

interface StepItem {
  id: string;
  title: string;
  details: string;
  attachments: File[];
  open: boolean;
}

const END_DATE = new Date("2026-03-06T00:00:00");

export default function InvestmentsTemporary() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [project, setProject] = useState<SuggestedProject | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [imageAttachments, setImageAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [steps, setSteps] = useState<StepItem[]>([
        {
      id: crypto.randomUUID(),
      title: "Securing land and necessaries",
      details: "",
      attachments: [],
      open: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Planning and land preparation",
      details: "",
      attachments: [],
      open: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Input procurement and logistics",
      details: "",
      attachments: [],
      open: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Planting and all matters of management",
      details: "",
      attachments: [],
      open: false,
    },
  ]);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const investments = await getInvestments();
      const seasonal = investments.find(
        (inv: SuggestedProject) =>
          inv.name.toLowerCase() === "seasonal farming",
      );
      if (seasonal) setProject(seasonal);
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
      const updated = investments.find(
        (inv: SuggestedProject) => inv.id === project.id,
      );
      if (updated) setProject(updated);
    }
  };

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, open: !step.open } : step,
      ),
    );
  };

  const updateStepDetails = (id: string, value: string) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, details: value } : step,
      ),
    );
  };

  const updateStepAttachments = (id: string, files: FileList | null) => {
    if (!files) return;
    setSteps((prev) =>
      prev.map((step) =>
        step.id === id
          ? { ...step, attachments: Array.from(files) }
          : step,
      ),
    );
  };

  const handleProceed = () => {
    if (project?.status === "approved") router.push("/revolution");
  };

  if (loading || !project) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-2xl text-brand">...</p>
      </main>
    );
  }

  const progress = Math.min(project.votes * 10, 100);

  return (
    <main className="min-h-screen px-4 py-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Seasonal Farming</h1>
          {timeLeft && (
            <p className="text-brand font-semibold text-sm">
              Closes in {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </p>
          )}
        </div>

        <div className="relative w-full h-80 rounded-2xl overflow-hidden">
          <Image
            src="/images/farm.jpg"
            alt="Seasonal Farming"
            fill
            className="object-cover"
          />

          <div className="absolute inset-0 flex items-end justify-between p-4">

            <div className="flex items-center gap-2">
              <button
                onClick={handleVote}
                className={`w-10 h-10 rounded-full border flex items-center justify-center p-1 ${
                  project.hasVoted
                    ? "bg-green-500 border-green-500"
                    : "border-white bg-white/30"
                }`}
              >
                {project.hasVoted && (
                  <Image
                    src="/icons/home.svg"
                    alt="Voted"
                    width={16}
                    height={16}
                  />
                )}
              </button>
              <span className="text-white text-md font-semibold">
                Vote
              </span>
            </div>

            <label className="cursor-pointer bg-white/50 p-1 rounded-full">
              <Image
                src="/icons/sunset.svg"
                alt="Attach"
                width={32}
                height={32}
              />
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) =>
                  e.target.files &&
                  setImageAttachments(Array.from(e.target.files))
                }
              />
            </label>
          </div>

          <div className="absolute top-4 right-4 bg-gray-100/50 text-gray-500 px-2 py-2 rounded-xs text-lg font-bold">
           <span className="text-md"> KES</span> 50000
          </div>

          <div className="absolute bottom-0 left-0 h-2 bg-black/40 w-full">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <section className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className="rounded-2xl bg-white/5 border p-4 space-y-3"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-sm">
                  {step.title}
                </h2>
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-8 h-8 rounded-full border flex items-center justify-center"
                >
                  <Image
                    src="/icons/plus.svg"
                    alt="Expand"
                    width={14}
                    height={14}
                  />
                </button>
              </div>

              {step.open && (
                <div className="space-y-3">
                  <textarea
                    value={step.details}
                    onChange={(e) =>
                      updateStepDetails(step.id, e.target.value)
                    }
                    placeholder="Add more details..."
                    className="w-full p-2 rounded-xl bg-white/10 border text-sm"
                  />
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      updateStepAttachments(step.id, e.target.files)
                    }
                    className="text-xs"
                  />
                  <div className="text-xs text-gray-400">
                    {step.attachments.length} file(s)
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        {currentUser &&
          OFFICIAL_ROLES.includes(
            currentUser.role as
              | "chairperson"
              | "secretary"
              | "treasurer",
          ) && (
            <button
              onClick={handleApprove}
              className="w-full py-3 rounded-2xl bg-brand text-white font-semibold"
            >
              Approved Investment
            </button>
          )}

        <button
          disabled={project.status !== "approved"}
          onClick={handleProceed}
          className={`w-full py-3 rounded-2xl font-semibold ${
            project.status === "approved"
              ? "bg-brand text-white"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          Proceed to Revolution
        </button>
      </div>
    </main>
  );
}