"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { mockMonthlyContributions } from "@/lib/mock";
import Footer from "./Footer";

const officialsOrder = ["Chairman", "Treasurer", "Secretary"];

const Members = () => {
  const router = useRouter();

  const officials = mockMonthlyContributions.filter((m) =>
    officialsOrder.includes(m.role)
  );

  const others = mockMonthlyContributions.filter(
    (m) => !officialsOrder.includes(m.role)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="py-6 px-4 w-[90%] mx-auto space-y-4 flex-1">
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded hover:bg-white/10"
            onClick={() => router.back()}
          >
            <Image src="/icons/arrow-left.svg" alt="" width={22} height={22} />
          </button>
          <h1 className="text-3xl font-bold text-foreground">Members</h1>
        </div>

        <h1 className="text-2xl font-bold text-brand text-start">
          Revolution Brothers
        </h1>

        <p className="text-gray-400 text-xl text-center">Officials 2025–2026</p>

        <div className="flex justify-center gap-4 mt-6">
          {officials.map((member) => (
            <div
              key={member.userId}
              className="relative group"
              onClick={() => router.push("/finances")}
            >
              <div className="w-22 h-22 p-2 rounded-full border-2 border-brand flex flex-col items-center justify-center text-center shadow-md hover:scale-105 transition cursor-pointer">
                <p className="text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-gray-400">{member.role}</p>
              </div>

              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition pointer-events-none z-20">
                <div className="rounded-2xl bg-white/10 backdrop-blur p-4 shadow-lg">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{member.name}</h2>
                      <p className="text-sm text-gray-400 mb-2">{member.role}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-black/30 p-2 flex items-center justify-center">
                      <Image
                        src={member.image || "/icons/profiles.svg"}
                        alt={member.name}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-3">
                    <span className="text-sm text-gray-400">
                      ID: {member.userId}
                    </span>
                    <span className="text-xs italic text-gray-400">
                      Signature
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
          {others.map((member) => (
            <div
              key={member.userId}
              onClick={() => router.push("/finances")}
              className="cursor-pointer rounded-2xl bg-white/5 p-4 shadow hover:bg-white/10 transition"
            >
              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{member.name}</h2>
                  <p className="text-sm text-gray-400 mb-2">{member.role}</p>
                </div>

                <div className="w-12 h-12 rounded-full overflow-hidden border border-black/30 p-2 flex items-center justify-center">
                  <Image
                    src={member.image || "/icons/profiles.svg"}
                    alt={member.name}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>

              <div className="flex justify-between items-end mt-3">
                <span className="text-sm text-gray-400">
                  ID: {member.userId}
                </span>
                <span className="text-xs italic text-gray-400">
                  Signature
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Members;