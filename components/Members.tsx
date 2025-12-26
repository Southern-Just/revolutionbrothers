"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getAllUsers, type MemberDTO } from "@/lib/actions/user.systeme";

const OFFICIAL_ROLES = ["chairperson", "secretary", "treasurer"] as const;
type OfficialRole = (typeof OFFICIAL_ROLES)[number];
const isOfficial = (role: string): role is OfficialRole =>
  OFFICIAL_ROLES.includes(role as OfficialRole);

export default function Members() {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [activeUserId, setActiveUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAllUsers();
        setMembers(data.members);
        setActiveUserId(data.activeUserId);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center text-gray-400 bg-gray-50">
        <Image
          src="/icons/loader1.svg"
          alt="Loading"
          width={220}
          height={220}
          className="animate-spin"
        />
        <p className="text-gray-700 text-sm">Loading members…</p>
      </div>
    );
  }

  const officials = members
    .filter((m) => isOfficial(m.role))
    .sort(
      (a, b) =>
        OFFICIAL_ROLES.indexOf(a.role as OfficialRole) -
        OFFICIAL_ROLES.indexOf(b.role as OfficialRole)
    );

  const others = members.filter((m) => !isOfficial(m.role));
  const sortedOthers = (() => {
    const copy = [...others];
    const idx = copy.findIndex((m) => m.userId === activeUserId);
    if (idx > -1) {
      const [active] = copy.splice(idx, 1);
      return [active, ...copy];
    }
    return copy;
  })();

  return (
    <div className="min-h-screen items-start flex justify-center px-2">
      <div className="flex flex-col items-center space-y-4 py-3 w-full max-w-6xl">
        <h1 className="text-xl font-bold text-center bg-brand/10 p-2 rounded-sm backdrop-blur-3xl">
          REVOLUTION BROTHERS Members :{" "}
          <span className="text-brand">KIKOSI</span>
        </h1>
        {/* <h1 className="text-xl font-bold text-center bg-brand/10 p-2 rounded-sm backdrop-blur-3xl">
          REVOLUTION BROTHERS Members :{" "}
          <span className="text-brand">KIKOSI</span>
        </h1> */}

        <p className="text-gray-400 text-lg text-center">Officials 2025–2026</p>

        <div className="flex justify-center gap-6 mt-4 flex-wrap">
          {officials.map((member) => (
            <div
              key={member.userId}
              className="w-20 h-20 p-1 rounded-full border border-brand flex flex-col items-center justify-center shadow-md hover:scale-105 transition cursor-pointer text-center"
            >
              <p className="text-sm font-semibold">{member.name}</p>
              <p className="text-xs text-gray-400">{member.role}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full justify-items-center">
          {sortedOthers.map((member) => {
            const isActive = member.userId === activeUserId;

            return (
              <div
                key={member.userId}
                className={`w-full max-w-xs cursor-pointer rounded-2xl bg-white/5 p-4 shadow hover:bg-white/10 transition ${
                  isActive ? "border border-brand" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col space-y-1">
                    <h2 className="text-lg font-semibold">{member.name}</h2>
                    <p className="text-sm text-gray-400">{member.role}</p>
                  </div>

                  <div className="w-12 h-12 rounded-full overflow-hidden border border-black/30 p-0.5 flex items-center justify-center bg-gray-200">
                    <Image
                      src={member.profileImage || "/icons/profiles.svg"}
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
