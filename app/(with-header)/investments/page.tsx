"use client";

import { useState, useEffect } from "react";
import {
  suggestInvestment,
  voteOnInvestment,
  getInvestments,
  removeInvestment,
  updateInvestment,
  approveInvestment,
} from "@/lib/actions/investment.actions";
import { getCurrentUser } from "@/lib/actions/user.actions";
import Image from "next/image";
import { toast } from "sonner";
import { OFFICIAL_ROLES } from "@/lib/utils/utils";
import { getAllUsers } from "@/lib/actions/user.systeme";

interface NewProject {
  name: string;
  cost: string;

  time: string;
  details: string;
  return?: string;
  selectedUserId?: string;
}

interface SuggestedProject {
  id: string;
  name: string;
  suggester: string | null;
  suggesterId: string;
  details: string | null;
  cost: string | null;
  return: string | null;
  time: string | null;
  votes: number;
  hasVoted: boolean;
  status: "suggested" | "approved" | "active" | "completed";
  inCharge?: string[] | null;
  progress?: number | null;
  amountInvested?: number | null;
  createdAt: Date;
}

interface CurrentUser {
  id: string;
  role: "chairperson" | "secretary" | "treasurer" | "member";
}

interface User {
  userId: string;
  name: string;
  role: string;
  username: string | null;
  phone: string | null;
  profileImage: string | null;
}

const INITIAL_PROJECT: NewProject = {
  name: "",
  cost: "",
  time: "",
  details: "",
};

export default function Investment() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newProject, setNewProject] = useState<NewProject>(INITIAL_PROJECT);
  const [projects, setProjects] = useState<SuggestedProject[]>([]);
  const [isPageVisible, setIsPageVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [editingProject, setEditingProject] = useState<SuggestedProject | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchInvestments();
    fetchCurrentUser();
    fetchAllUsers();
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const data = await getInvestments();
      setProjects(data);
    } catch (err) {
      setError("Failed to load investments");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error("Failed to get current user", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { officials, others } = await getAllUsers();
      const all = [...Object.values(officials), ...others];
      setAllUsers(all);
    } catch (err) {
      console.error("Failed to get all users", err);
    }
  };

  const openModal = (project?: SuggestedProject): void => {
    setIsModalOpen(true);
    if (project) {
      setEditingProject(project);
      setNewProject({
        name: project.name,
        cost: project.cost || "",
        time: project.time || "",
        details: project.details || "",
        return: project.return || "",
        selectedUserId: project.inCharge && project.inCharge.length > 1 ? project.inCharge[1] : undefined,
      });
    } else {
      setEditingProject(null);
      setNewProject(INITIAL_PROJECT);
    }
  };

  const closeModal = (): void => {
    setIsModalOpen(false);
    setNewProject(INITIAL_PROJECT);
    setEditingProject(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { name, cost, time, details, return: returnValue, selectedUserId } = newProject;
    if (!name || !cost || !time || !details) return;

    try {
      if (editingProject) {
        // Assume updateInvestment is added to server actions
        await updateInvestment({ id: editingProject.id, name, cost, time, details, return: returnValue, selectedUserId });
        toast.success("Investment updated successfully");
      } else {
        await suggestInvestment({ name, cost, time, details, return: returnValue, selectedUserId });
        toast.success("Investment suggested successfully");
      }
      await fetchInvestments();
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error(editingProject ? "Failed to update investment" : "Failed to suggest investment");
    }
  };

  const handleRemove = async () => {
    if (!editingProject) return;
    if (!confirm("Are you sure you want to remove this suggested project?")) return;
    try {
      await removeInvestment({ investmentId: editingProject.id });
      await fetchInvestments();
      toast.success("Investment removed");
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove investment");
    }
  };

  const handleVote = async (id: string) => {
    try {
      const result = await voteOnInvestment({ investmentId: id });
      setProjects((prev) =>
        prev.map((project) =>
          project.id === id
            ? { ...project, votes: result.votes, hasVoted: result.hasVoted }
            : project
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to vote");
    }
  };

  const handleApprove = async (id: string) => {
    if (!currentUser) return;
    try {
      await approveInvestment({ investmentId: id });
      await fetchInvestments();
      toast.success("Investment approved");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to approve investment";
      toast.error(message);
    }
  };

  const getInChargeNames = (inCharge: string[] | null | undefined, allUsers: User[]): string => {
    if (!inCharge || inCharge.length === 0) return "TBD";
    return inCharge
      .map(id => allUsers.find(user => user.userId === id)?.name || "Unknown")
      .join(" & ");
  };

  const filteredUsers = allUsers.filter(user => user.userId !== currentUser?.id);

  const suggestedProjects = projects.filter((p) => p.status === "suggested");
  const approvedProjects = projects.filter((p) =>
    p.status === "approved" || p.status === "active" || p.status === "completed"
  );

  if (loading) {
    return (
      <main className="min-h-screen px-3 flex justify-center items-center">
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-400">
          <Image
            src="/icons/loader1.svg"
            alt="Loading"
            width={220}
            height={220}
            className="animate-spin"
          />
          <p className="mt-2 text-gray-400">Loading investments...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen px-3 flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-400">Kaalei, {error}</p>
          <button onClick={fetchInvestments} className="mt-2 text-brand underline">
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen px-3 flex justify-center transition-all duration-700 ease-out ${
        isPageVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="w-full max-w-6xl py-4 space-y-6">
        <header className="space-y-1 ml-2">
          <h1 className="text-xl font-bold">Investments Hub</h1>
          <p className="text-gray-400 text-xs">
            Propose, vote, and track group investment projects
          </p>
        </header>

        <section className="rounded-2xl bg-white/5 border border-brand/30 p-4 shadow space-y-3">
          <h2 className="font-semibold">Have an Investment Idea?</h2>
          <p className="text-sm text-gray-400">
            Suggest a project to the group. Members can review, vote, and approve it.
          </p>
          <button
            onClick={() => openModal()}
            className="w-full rounded-xl border border-brand text-brand py-2 text-sm font-medium hover:bg-white/10 transition"
          >
            + Suggest New Investment
          </button>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 px-1">
            Suggested Projects (Voting)
          </h2>

          {suggestedProjects.length === 0 ? (
            <p className="text-gray-400 text-xs indent-8">No suggested projects yet.</p>
          ) : (
            suggestedProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl bg-white/5 p-4 border border-brand/20 shadow space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-xs text-gray-400">
                      Suggested by {project.suggester || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      In charge: {getInChargeNames(project.inCharge, allUsers)}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    {currentUser && project.suggesterId === currentUser.id && (
                      <button
                        onClick={() => openModal(project)}
                        title="Edit"
                        className="w-7 h-7 rounded-full border flex items-center justify-center transition border-gray-400 text-gray-400 hover:bg-white/10"
                      >
                        <Image
                          src="/icons/edit.svg"
                          alt="Edit"
                          width={16}
                          height={16}
                        />
                      </button>
                    )}

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

                    {currentUser && OFFICIAL_ROLES.includes(currentUser.role as "chairperson" | "secretary" | "treasurer") && (
                      <button
                        onClick={() => handleApprove(project.id)}
                        title="Approve (Officials)"
                        className={`w-7 h-7 rounded-full border flex items-center justify-center transition ${
                          project.status === "approved"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "border-blue-500 text-blue-500 hover:bg-blue-100"
                        }`}
                      >
                        ✓✓
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-300">{project.details || ""}</p>

                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                  {project.cost && <span>Cost: {project.cost}</span>}
                  {project.return && <span>Return: {project.return}</span>}
                  {project.time && <span>Time: {project.time}</span>}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Votes</span>
                  <span className="text-brand font-semibold">{project.votes}</span>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-wide text-gray-400 px-1">
            Approved Investments
          </h2>

          {approvedProjects.length === 0 ? (
            <p className="text-gray-400 text-xs indent-8">No approved investments yet.</p>
          ) : (
            approvedProjects.map((project) => (
              <details
                key={project.id}
                className={`rounded-2xl bg-white/5 p-4 border shadow ${
                  project.status === "completed"
                    ? "border-brand/10"
                    : "border-brand/20"
                }`}
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-xs text-gray-400">
                        In charge: {getInChargeNames(project.inCharge, allUsers)}
                      </p>
                    </div>
                    <span className="text-xs text-brand capitalize">{project.status}</span>
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-400">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </summary>

                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-300">{project.details || ""}</p>

                  {project.amountInvested && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Amount Invested</span>
                      <span>KES {project.amountInvested.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </details>
            ))
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl p-4 w-full max-w-md mx-4 space-y-4">
            <h2 className="text-lg font-semibold">
              {editingProject ? "Edit Investment" : "Suggest New Investment"}
            </h2>
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
              <input
                type="text"
                placeholder="Return (optional, e.g., ~18%)"
                value={newProject.return || ""}
                onChange={(e) =>
                  setNewProject({ ...newProject, return: e.target.value })
                }
                className="w-full p-2 rounded-md bg-white/10 border border-brand/90 text-sm outline-brand"
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
              <div>
                <p className="text-sm text-gray-400">Select another person in charge (optional):</p>
                <div className="flex space-x-2 mt-2 overflow-x-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.userId}
                      type="button"
                      onClick={() => setNewProject({ ...newProject, selectedUserId: user.userId })}
                      className={`w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 ${
                        newProject.selectedUserId === user.userId ? "border-brand" : "border-gray-300"
                      }`}
                    >
                      <Image
                        src={user.profileImage || "/icons/profile.svg"}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand text-white py-2 text-sm font-medium hover:bg-brand/80 transition"
                >
                  {editingProject ? "Update" : "Suggest"}
                </button>
                {editingProject && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="flex-1 rounded-xl border border-red-500 text-red-500 py-2 text-sm font-medium hover:bg-red-100 transition"
                  >
                    Remove
                  </button>
                )}
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