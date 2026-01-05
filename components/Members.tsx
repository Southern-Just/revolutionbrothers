"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  getAllUsers,
  type MemberDTO,
} from "@/lib/actions/user.systeme";

import {
  OFFICIAL_ROLES,
  type OfficialRole,
} from "@/lib/utils/utils";

export default function Members() {
  const router = useRouter();

  const [officials, setOfficials] =
    useState<Partial<Record<OfficialRole, MemberDTO>>>({});
  const [others, setOthers] = useState<MemberDTO[]>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const data = await getAllUsers();
        setOfficials(data.officials);
        setOthers(data.others);
        setActiveUserId(data.activeUserId);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const sortedOthers = (() => {
    const copy = [...others];
    const index = copy.findIndex(
      (m) => m.userId === activeUserId,
    );

    if (index > -1) {
      const [active] = copy.splice(index, 1);
      return [active, ...copy];
    }

    return copy;
  })();

  return (
    <div className="min-h-screen flex justify-center px-2">
      <div className="flex flex-col items-center space-y-4 py-3 w-full max-w-6xl">
        <h1 className="text-xl font-bold text-center p-2">
          REVOLUTION BROTHERS Members :{" "}
          <span className="text-brand">KIKOSI</span>
        </h1>

        <p className="text-gray-400 text-lg text-center">
          Officials 2025–2026
        </p>

        {/* -------- OFFICIALS -------- */}
        <div className="flex justify-center gap-6 mt-4 flex-wrap">
          {OFFICIAL_ROLES.map((role) => {
            const member = officials[role];
            const isActive = member?.userId === activeUserId;

            if (!member) {
              return (
                <div
                  key={role}
                  className="w-21 h-21 p-1 rounded-full border border-brand/30 flex flex-col items-center justify-center shadow-md animate-pulse"
                >
                  <div className="w-10 h-3 bg-gray-300 rounded mb-1" />
                  <div className="w-8 h-2 bg-gray-200 rounded" />
                </div>
              );
            }

            return (
              <div
                key={role}
                onClick={() =>
                  isActive && router.push("/account")
                }
                className={`relative w-21 h-21 p-1 rounded-full border border-brand flex flex-col items-center justify-center shadow-md transition text-center ${
                  isActive
                    ? "cursor-pointer hover:scale-105"
                    : "cursor-default"
                }`}
              >
                <p className="text-sm font-semibold">
                  {member.name}
                </p>
                <p className="text-xs text-gray-400">
                  {member.role}
                </p>

                <div className="absolute bottom-full mb-2 bg-white p-2 rounded shadow opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center">
                  <Image
                    src={
                      member.profileImage ||
                      "/icons/profiles.svg"
                    }
                    alt={member.name}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <p className="text-[9px] text-gray-600 mt-1">
                    ID: {member.userId}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* -------- MEMBERS -------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full justify-items-center">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full max-w-xs rounded-2xl bg-white/5 p-4 shadow animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col space-y-2">
                      <div className="w-32 h-4 bg-gray-300 rounded" />
                      <div className="w-20 h-3 bg-gray-200 rounded" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                  </div>

                  <div className="flex justify-between items-end mt-3">
                    <div className="w-24 h-2 bg-gray-200 rounded" />
                    <div className="w-16 h-2 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
            : sortedOthers.map((member) => {
                const isActive =
                  member.userId === activeUserId;

                return (
                  <div
                    key={member.userId}
                    onClick={() =>
                      isActive && router.push("/account")
                    }
                    className={`w-full max-w-xs rounded-2xl bg-white/5 p-4 shadow transition ${
                      isActive
                        ? "border border-brand cursor-pointer hover:bg-white/10"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col space-y-1">
                        <h2 className="text-lg font-semibold">
                          {member.name}
                        </h2>
                        <p className="text-sm text-gray-400">
                          {member.role}
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-full overflow-hidden border border-black/30 p-0.5 flex items-center justify-center bg-gray-200">
                        <Image
                          src={
                            member.profileImage ||
                            "/icons/profiles.svg"
                          }
                          alt={member.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full rounded-full"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-3">
                      <span className="text-[10px] text-gray-400">
                        ID: {member.userId}
                      </span>
                      <span className="text-xs italic text-gray-400">
                        Signature
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}
