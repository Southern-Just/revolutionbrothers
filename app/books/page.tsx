"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ComingSoon() {
  const router = useRouter();
  return (
      <div className="min-h-screen flex items-start justify-center mt-24 overflow-hidden relative bg-white page-animate">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.8),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.7),transparent_60%)] animate-[pulse_6s_ease-in-out_infinite]" />

        <div className="relative z-10 backdrop-blur-3xl bg-white/60  rounded-3xl px-10 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] text-center transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02]">
          <div className="justify-center flex">
            <Image
              src="/icons/books.svg"
              alt="Books Icon"
              width={100}
              height={100}
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Feature Coming Soon !!!
          </h1>

          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Financial books and resources as Found to be posted here .
          </p>
        </div>

        <div className="absolute -bottom-40 -left-40 w-md h-112 bg-white/70 rounded-full blur-[120px] animate-[pulse_7s_ease-in-out_infinite]" />
        <div className="absolute -top-40 -right-40 w-md h-112 bg-white/60 rounded-full blur-[140px] animate-[pulse_9s_ease-in-out_infinite]" />
        <button
          className="absolute bottom-60 right-15 bg-white shadow-lg shadow-gray-300 p-4 py-2 text-xl rounded-lg"
          onClick={() => {
            router.back();
          }}
        >
          Back
        </button>
      </div>
  );
}
