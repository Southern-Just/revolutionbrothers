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

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const greetingRef = useRef<HTMLDivElement>(null);

  /* ---------------- Auto slide ---------------- */
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((p) => (p + 1) % slides.length);
    }, 15000);

    return () => clearInterval(id);
  }, []);

  /* ---------------- Rounded edge logic ---------------- */
  const updateRoundedEdges = () => {
    const container = containerRef.current;
    const greeting = greetingRef.current;
    if (!container || !greeting) return;

    const c = container.getBoundingClientRect();
    const g = greeting.getBoundingClientRect();
    const tolerance = 4;

    const atLeft = g.left <= c.left + tolerance;
    const atRight = g.right >= c.right - tolerance;

    greeting.classList.remove(
      "rounded-t-xl",
      "rounded-tr-xl",
      "rounded-tl-xl"
    );

    if (atLeft && atRight) greeting.classList.add("rounded-t-xl");
    else if (atLeft) greeting.classList.add("rounded-tr-xl");
    else if (atRight) greeting.classList.add("rounded-tl-xl");
    else greeting.classList.add("rounded-t-xl");
  };

  /* ---------------- Drag handlers ---------------- */
  const startDrag = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX - dragOffset);
  };

  const updateOffset = (clientX: number) => {
    const container = containerRef.current;
    const greeting = greetingRef.current;
    if (!container || !greeting) return;

    const max =
      container.offsetWidth - greeting.offsetWidth;

    const next = Math.max(
      0,
      Math.min(max, clientX - startX)
    );

    setDragOffset(next);

    requestAnimationFrame(updateRoundedEdges);
  };

  const stopDrag = () => setIsDragging(false);

  /* ---------------- Render ---------------- */
  return (
    <section className="mt-1">
      <div
        ref={containerRef}
        className="relative w-full"
        onMouseMove={(e) =>
          isDragging && updateOffset(e.clientX)
        }
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchMove={(e) =>
          isDragging &&
          updateOffset(e.touches[0].clientX)
        }
        onTouchEnd={stopDrag}
      >
        <div
          ref={greetingRef}
          onMouseDown={(e) => startDrag(e.clientX)}
          onTouchStart={(e) =>
            startDrag(e.touches[0].clientX)
          }
          className="absolute bg-black flex text-gray-400 px-1.5 py-2 w-max rounded-tr-xl cursor-grab"
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging
              ? "none"
              : "transform 0.3s ease-out",
          }}
        >
          <h4 className="text-sm indent-1.5 font-semibold select-none">
            Good Evening <span>🙂</span>
          </h4>
        </div>

        <div className="h-8" />
      </div>

      {/* Slides */}
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
