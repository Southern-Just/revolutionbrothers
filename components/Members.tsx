"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getMembers, OFFICIAL_ROLES, MemberRole } from "@/lib/users.systeme";

const ACTIVE_USER_ID = "1";

type BackendMember = Awaited<ReturnType<typeof getMembers>>[number];

type Member = BackendMember & { userId: string };

const isOfficial = (
  role: MemberRole
): role is Exclude<MemberRole, "member"> => {
  return OFFICIAL_ROLES.includes(role);
};

const Members = () => {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem("members");
    if (cached) {
      setMembers(JSON.parse(cached));
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await getMembers();
        const mapped: Member[] = data.map((m) => ({ ...m, userId: m.id }));
        setMembers(mapped);
        sessionStorage.setItem("members", JSON.stringify(mapped));
      } catch {
        router.replace("/");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const officials = members
    .filter((m) => isOfficial(m.role))
    .sort(
      (a, b) =>
        OFFICIAL_ROLES.indexOf(a.role) -
        OFFICIAL_ROLES.indexOf(b.role)
    );

  const others = members.filter((m) => m.role === "member");

  const sortedOthers = (() => {
    const copy = [...others];
    const idx = copy.findIndex((m) => m.userId === ACTIVE_USER_ID);
    if (idx > -1) {
      const [active] = copy.splice(idx, 1);
      return [active, ...copy];
    }
    return copy;
  })();

  return (
    <div className="min-h-screen items-start flex justify-center px-2">
      <div className="flex flex-col items-center space-y-4 py-3 w-full max-w-6xl">
        <h1 className="text-xl font-bold text-center">
          Revolution Brothers Members :
          <span className="text-brand"> KIKOSI</span>
        </h1>

        <p className="text-gray-400 text-lg text-center">
          Officials 2025–2026
        </p>

        <div className="flex justify-center gap-6 mt-4 flex-wrap">
          {loading
            ? Array(3).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="w-20 h-20 rounded-full bg-gray-200 animate-pulse"
                />
              ))
            : officials.map((member) => (
                <div
                  key={member.userId}
                  onClick={() => router.push("/finances")}
                  className="w-20 h-20 p-1 rounded-full border border-brand flex flex-col items-center justify-center shadow-md hover:scale-105 transition cursor-pointer text-center"
                >
                  <p className="text-sm font-semibold">{member.name}</p>
                  <p className="text-xs text-gray-400">{member.role}</p>
                </div>
              ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6 w-full justify-items-center">
          {loading
            ? Array(6).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="w-full max-w-xs h-32 rounded-2xl bg-gray-200 animate-pulse"
                />
              ))
            : sortedOthers.map((member) => {
                const isActive = member.userId === ACTIVE_USER_ID;

                return (
                  <div
                    key={member.userId}
                    onClick={() => router.push("/finances")}
                    className={`w-full max-w-xs cursor-pointer rounded-2xl bg-white/5 p-4 shadow hover:bg-white/10 transition ${
                      isActive ? "border border-brand" : ""
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
};

export default Members;
