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
const getGreeting = (hours: number) => {
  if (hours < 11) return "Good Morning ☀️";
  if (hours < 14) return "Almost Noon 🌤️ / After Noon 🌇";
  return "Good Evening 🌙";
};

const getStepForHour = (hours: number) => {
  if (hours < 11) return 0; // left
  if (hours < 14) return 1; // middle
  return 2; // right
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

  /* ---------------- Real-time 3-stop glide ---------------- */
  useEffect(() => {
    const updatePosition = () => {
      const container = containerRef.current;
      const greetingEl = greetingRef.current;
      if (!container || !greetingEl) return;

      const max = container.offsetWidth - greetingEl.offsetWidth;
      const middle = max / 2;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const step = getStepForHour(hours);
      let smoothOffset = 0;

      if (step === 0) {
        smoothOffset = 0; // left
      } else if (step === 1) {
        // fraction through 11:00–14:00
        const totalMinutes = (14 - 11) * 60; // 180
        const elapsedMinutes = (hours - 11) * 60 + minutes + seconds / 60;
        smoothOffset = middle * (elapsedMinutes / totalMinutes + 0.5); // centered gradually
      } else {
        smoothOffset = max; // right
      }

      setDragOffset(smoothOffset);
      setGreeting(getGreeting(hours));

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

    const interval = setInterval(updatePosition, 1000);
    updatePosition();
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="mt-1">
      <div ref={containerRef} className="relative w-full">
        <div
          ref={greetingRef}
          className="absolute bg-black flex text-gray-400 px-1.5 py-2 w-max rounded-tr-xl select-none"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: "transform 1s linear",
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
            className={`absolute inset-0 mt-6 px-6 flex flex-col space-y-6 transition-all duration-2000 ease-in-out ${
              index === currentIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <h1 className="text-4xl md:text-5xl text-brand font-bold leading-tight">
              Revolution <br /> 〰〰〰Brothers
            </h1>

            <h2 className="text-xl md:text-3xl font-bold text-white">
              {slide.title}
            </h2>

            <p className="text-xs md:text-2xl max-w-4xl text-white/90">
              {slide.subtitle}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;
