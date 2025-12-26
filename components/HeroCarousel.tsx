"use client";
import React, { useEffect, useRef, useState } from "react";

const slides = [
  {
    title: "Save Together, Grow Together",
    subtitle:
      "Pool savings with friends in a secure group circle, Lets earn collective interest, and achieve shared financial goals faster.",
  },
  {
    title: "Invest as Brothers",
    subtitle:
      "Access curated investment opportunities, contribute as a community, and build generational wealth through unified financial power.",
  },
  {
    title: "Share Wisdom, Shape Progress",
    subtitle:
      "Learn, teach, and exchange real financial knowledge while actively participating in each other's economic liberation and growth.",
  },
] as const;

/* ---------------- Greeting and step ---------------- */
const getGreeting = (hours: number, minutes: number, seconds: number) => {
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Define time ranges in seconds
  const morningEnd = 11 * 3600; // 11:00 AM
  const almostNoonEnd = 12.5 * 3600; // 12:30 PM
  const afternoonEnd = 14 * 3600; // 2:00 PM

  if (totalSeconds < morningEnd) return "Good Morning ☀️";
  if (totalSeconds < almostNoonEnd) return "Almost Noon 🌤️";
  if (totalSeconds < afternoonEnd) return "After Noon 🌇";
  return "Good Evening 🌙";
};

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [greeting, setGreeting] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);

  /* ---------------- Auto slide ---------------- */
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((p) => (p + 1) % slides.length);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  /* ---------------- Real-time smooth scrolling ---------------- */
  useEffect(() => {
    const updatePosition = () => {
      const container = containerRef.current;
      const greetingEl = greetingRef.current;
      if (!container || !greetingEl) return;

      const containerWidth = container.offsetWidth;
      const greetingWidth = greetingEl.offsetWidth;
      const maxOffset = containerWidth - greetingWidth;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Calculate total seconds in the day
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      // Define transition points (in seconds)
      const morningStart = 0; // 12:00 AM
      const morningEnd = 11 * 3600; // 11:00 AM
      const almostNoonEnd = 12.5 * 3600; // 12:30 PM
      const afternoonEnd = 14 * 3600; // 2:00 PM
      const dayEnd = 24 * 3600; // 12:00 AM

      let smoothOffset = 0;
      let progress = 0;

      if (totalSeconds <= morningEnd) {
        // Morning: Left to Center
        progress = totalSeconds / morningEnd;
        smoothOffset = (maxOffset / 2) * progress; // 0% to 50% of max
      } else if (totalSeconds <= almostNoonEnd) {
        // Almost Noon: Center to Right
        progress = (totalSeconds - morningEnd) / (almostNoonEnd - morningEnd);
        smoothOffset = maxOffset / 2 + (maxOffset / 4) * progress; // 50% to 75% of max
      } else if (totalSeconds <= afternoonEnd) {
        // After Noon: Right (stays at right)
        smoothOffset = maxOffset;
      } else {
        // Evening: Right (remains at right)
        smoothOffset = maxOffset;
      }

      // Get current greeting
      const currentGreeting = getGreeting(hours, minutes, seconds);
      setGreeting(currentGreeting);
      setDragOffset(smoothOffset);

      // Rounded edges logic
      const c = container.getBoundingClientRect();
      const g = greetingEl.getBoundingClientRect();
      const tolerance = 2;

      const atLeft = g.left <= c.left + tolerance;
      const atRight = g.right >= c.right - tolerance;

      greetingEl.classList.remove(
        "rounded-t-xl",
        "rounded-tr-xl",
        "rounded-tl-xl"
      );

      if (atLeft && atRight) greetingEl.classList.add("rounded-t-xl");
      else if (atLeft) greetingEl.classList.add("rounded-tr-xl");
      else if (atRight) greetingEl.classList.add("rounded-tl-xl");
      else greetingEl.classList.add("rounded-t-xl");
    };

    const interval = setInterval(updatePosition, 100);
    updatePosition();
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mt-1">
      <div ref={containerRef} className="relative w-full">
        <div
          ref={greetingRef}
          className="absolute bg-black flex text-gray-400 px-1.5 py-2 w-max rounded-tr-xl select-none transition-all duration-300 ease-out"
          style={{
            transform: `translateX(${dragOffset}px)`,
            left: 0,
          }}
        >
          <h4 className="text-sm indent-1.5 font-semibold">{greeting}</h4>
        </div>
        <div className="h-8" />
      </div>

      {/* ---------------- Slides ---------------- */}
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-black">
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-transparent to-transparent pointer-events-none" />

        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 mt-6 px-6 flex flex-col space-y-6 transition-all duration-2000 ease-in-out md:text-center ${
              index === currentIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <h1 className="text-4xl md:text-5xl md:hidden text-brand font-bold leading-tight mt-2">
              Revolution <br /> 〰〰〰Brothers
            </h1>
            <h1 className="text-5xl md:text-5xl text-brand hidden md:block font-bold leading-tight mt-8">
              Revolution 〰Brothers
            </h1>

            <h2 className="text-xl md:text-3xl font-bold text-white md:text-center">
              {slide.title}
            </h2>
            <div className=" text-xs md:text-xl md:text-center md:w-[60%] mx-auto text-white md:text-gray-400 ">
              <p className="md:text-center">
                {slide.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
