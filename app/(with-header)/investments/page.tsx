"use client";

import { useState } from "react";

interface NewProject {
  name: string;
  cost: string;
  time: string;
  details: string;
}

interface SuggestedProject {
  id: number;
  name: string;
  suggester: string;
  details: string;
  cost: string;
  return: string;
  time: string;
  votes: number;
  hasVoted: boolean;
}

const INITIAL_PROJECT: NewProject = {
  name: "",
  cost: "",
  time: "",
  details: "",
};

const INITIAL_SUGGESTED_PROJECTS: SuggestedProject[] = [
  {
    id: 1,
    name: "Solar Power Installation",
    suggester: "Brian",
    details:
      "Small-scale solar installation for rental units to reduce power costs and generate long-term savings.",
    cost: "KES 220k",
    return: "~18%",
    time: "24 months",
    votes: 12,
    hasVoted: false,
  },
  {
    id: 2,
    name: "Poultry Farming",
    suggester: "Amina",
    details: "",
    cost: "KES 150k",
    return: "",
    time: "",
    votes: 7,
    hasVoted: false,
  },
];

/* =======================
   Component
======================= */
export default function Investment() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newProject, setNewProject] = useState<NewProject>(INITIAL_PROJECT);
  const [suggestedProjects, setSuggestedProjects] =
    useState<SuggestedProject[]>(INITIAL_SUGGESTED_PROJECTS);

  /* =======================
     Handlers
  ======================= */
  const openModal = (): void => {
    setIsModalOpen(true);
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setNewProject(INITIAL_PROJECT);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const { name, cost, time, details } = newProject;
    if (!name || !cost || !time || !details) return;

    setSuggestedProjects((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        name,
        suggester: "You",
        details,
        cost,
        return: "",
        time,
        votes: 0,
        hasVoted: false,
      },
    ]);

    closeModal();
  };

  const handleVote = (id: number): void => {
    setSuggestedProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              votes: project.hasVoted
                ? project.votes - 1
                : project.votes + 1,
              hasVoted: !project.hasVoted,
            }
          : project
      )
    );
  };

  return (
    <main className="min-h-screen px-3 flex justify-center">
      <div className="w-full max-w-6xl py-4 space-y-6">
        {/* Header */}
        <header className="space-y-1 ml-2">
          <h1 className="text-xl font-bold">Investments Hub</h1>
          <p className="text-gray-400 text-xs">
            Propose, vote, and track group investment projects
          </p>
        </header>

        {/* Top Actions */}
        <section className="rounded-2xl bg-white/5 border border-brand/30 p-4 shadow space-y-3">
          <h2 className="font-semibold">Have an Investment Idea?</h2>
          <p className="text-sm text-gray-400">
            Suggest a project to the group. Members can review, vote, and approve
            it.
          </p>

          <button
            onClick={openModal}
            className="w-full rounded-xl border border-brand text-brand py-2 text-sm font-medium hover:bg-white/10 transition"
          >
            + Suggest New Investment
          </button>
        </section>

        {/* Suggested Projects */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 px-1">
            Suggested Projects (Voting)
          </h2>

          {suggestedProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl bg-white/5 p-4 border border-brand/20 shadow space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-xs text-gray-400">
                    Suggested by {project.suggester}
                  </p>
                </div>

                <button
                  onClick={() => handleVote(project.id)}
                  title="Vote"
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                    project.hasVoted
                      ? "bg-brand text-white border-brand"
                      : "border-brand text-brand hover:bg-white/10"
                  }`}
                >
                  ✓
                </button>
              </div>

              <p className="text-sm text-gray-300">{project.details}</p>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <span>Cost: {project.cost}</span>
                {project.return && <span>Return: {project.return}</span>}
                {project.time && <span>Time: {project.time}</span>}
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Votes</span>
                <span className="text-brand font-semibold">
                  {project.votes}
                </span>
              </div>
            </div>
          ))}
        </section>

        {/* Approved / Active Investments */}
        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 px-1">
            Approved Investments
          </h2>

          {/* Active Investment */}
          <details className="rounded-2xl bg-white/5 p-4 border border-brand/20 shadow">
            <summary className="cursor-pointer list-none">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Commercial Farming</h3>
                  <p className="text-xs text-gray-400">
                    In charge: David & Amina
                  </p>
                </div>
                <span className="text-xs text-brand">Active</span>
              </div>

              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Progress</span>
                  <span>65%</span>
                </div>
                <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                  <div className="h-full w-[65%] bg-brand rounded-full" />
                </div>
              </div>
            </summary>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-gray-300">
                Large-scale crop production focused on maize and beans with
                seasonal returns and reinvestment plans.
              </p>

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount Invested</span>
                <span>KES 180,000</span>
              </div>
            </div>
          </details>

          {/* Completed Investment */}
          <details className="rounded-2xl bg-white/5 p-4 border border-brand/10 shadow">
            <summary className="cursor-pointer list-none">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Retail Shop Expansion</h3>
                  <p className="text-xs text-gray-400">
                    In charge: Sarah & John
                  </p>
                </div>
                <span className="text-xs text-brand">Completed</span>
              </div>
            </summary>

            <div className="mt-4 text-sm text-gray-300">
              Successfully expanded retail space with full capital recovery and
              profit distribution completed.
            </div>
          </details>
        </section>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl p-4 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">Suggest New Investment</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Project Name"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject({ ...newProject, name: e.target.value })
                }
                className="w-full p-4 rounded-md bg-white/10 border border-brand/90 text-sm outline-brand"
                required
              />

              <input
                type="text"
                placeholder="Cost (e.g., KES 100k)"
                value={newProject.cost}
                onChange={(e) =>
                  setNewProject({ ...newProject, cost: e.target.value })
                }
                className="w-full p-2 rounded-md bg-white/10 border border-brand/90 text-sm outline-brand"
                required
              />

              <input
                type="text"
                placeholder="Time (e.g., 12 months)"
                value={newProject.time}
                onChange={(e) =>
                  setNewProject({ ...newProject, time: e.target.value })
                }
                className="w-full p-2 rounded-md bg-white/10 border border-brand/90 text-sm outline-brand"
                required
              />

              <textarea
                placeholder="Details"
                value={newProject.details}
                onChange={(e) =>
                  setNewProject({ ...newProject, details: e.target.value })
                }
                className="w-full p-2 h-20 resize-none rounded-md bg-white/10 border border-brand/90 text-sm outline-brand"
                required
              />

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand text-white py-2 text-sm font-medium hover:bg-brand/80 transition"
                >
                  Suggest
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-brand text-brand py-2 text-sm font-medium hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
