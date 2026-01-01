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

/**
 * Custom hook to manage the dynamic greeting and its position based on current time.
 */
const useGreeting = () => {
  const [greeting, setGreeting] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const [isSliding, setIsSliding] = useState(true); // Track sliding animation
  const containerRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);

  const getGreeting = (hours: number) => {
    if (hours < 10) return "Good Morning ☀️";
    if (hours < 12) return "Almost Noon 🌤️";
    if (hours < 14) return "Good Afternoon 🌇";
    return "Good Evening 🌙";
  };

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

      let offset = 0;
      let greetingText = "";

      if (hours < 10) {
        // Far left
        offset = 0;
        greetingText = "Good Morning ☀️";
      } else if (hours < 12) {
        // Center
        offset = maxOffset / 2;
        greetingText = "Almost Noon 🌤️";
      } else if (hours < 14) {
        // Center
        offset = maxOffset / 2;
        greetingText = "Good Afternoon 🌇";
      } else {
        // Far right
        offset = maxOffset;
        greetingText = "Good Evening 🌙";
      }

      // Update greeting and offset
      setGreeting(greetingText);
      setDragOffset(offset);

      // Apply rounded edges based on position
      const c = container.getBoundingClientRect();
      const g = greetingEl.getBoundingClientRect();
      const tolerance = 2;

      const atLeft = g.left <= c.left + tolerance;
      const atRight = g.right >= c.right - tolerance;

      greetingEl.classList.remove("rounded-t-xl", "rounded-tr-xl", "rounded-tl-xl");

      if (atLeft && atRight) greetingEl.classList.add("rounded-t-xl");
      else if (atLeft) greetingEl.classList.add("rounded-tr-xl");
      else if (atRight) greetingEl.classList.add("rounded-tl-xl");
      else greetingEl.classList.add("rounded-t-xl");
    };

    const interval = setInterval(updatePosition, 100);
    updatePosition(); // Initial call

    // Start sliding animation after a short delay for smooth entry
    const slideTimeout = setTimeout(() => {
      setIsSliding(false);
    }, 500); // Adjust delay as needed for smoothness

    return () => {
      clearInterval(interval);
      clearTimeout(slideTimeout);
    };
  }, []);

  return { greeting, dragOffset, isSliding, containerRef, greetingRef };
};

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { greeting, dragOffset, isSliding, containerRef, greetingRef } = useGreeting();

  // Auto-slide every 15 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="mt-1">
      {/* Greeting Bar */}
      <div ref={containerRef} className="relative w-full">
        <div
          ref={greetingRef}
          className="absolute bg-black flex text-gray-400 px-1.5 py-2 w-max rounded-tr-xl select-none transition-all duration-700 ease-out" // Increased duration for smoother slide
          style={{
            transform: isSliding
              ? "translateY(100%)"
              : `translateX(${dragOffset}px)`,
            opacity: isSliding ? 0 : 1, 
            left: 0,
          }}
        >
          <h4 className="text-sm indent-1.5 font-semibold">{greeting}</h4>
        </div>
        <div className="h-8" />
      </div>

      {/* Slides Container */}
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
            <div className="text-xs md:text-xl md:text-center md:w-[60%] mx-auto text-white md:text-gray-400">
              <p className="md:text-center">{slide.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;