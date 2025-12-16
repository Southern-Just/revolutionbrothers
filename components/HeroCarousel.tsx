"use client";

import React, { useState, useEffect, useRef } from "react";

const slides = [
  {
    title: "",
    subtitle: "Savings n’ Investment Co.",
  },
  {
    title: "",
    subtitle: "Community-driven financial growth",
  },
  {
    title: "",
    subtitle: "Secure your tomorrow today",
  },
];

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [startX, setStartX] = useState(0);
  const greetingRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX - dragOffset);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !greetingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const greeting = greetingRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const greetingRect = greeting.getBoundingClientRect();
    
    const maxLeft = 0;
    const maxRight = containerRect.width - greetingRect.width;
    
    let newOffset = e.clientX - startX;
    
    // Constrain dragging within container bounds
    if (newOffset < maxLeft) newOffset = maxLeft;
    if (newOffset > maxRight) newOffset = maxRight;
    
    setDragOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - dragOffset);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !greetingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const greeting = greetingRef.current;
    
    const containerRect = container.getBoundingClientRect();
    const greetingRect = greeting.getBoundingClientRect();
    
    const maxLeft = 0;
    const maxRight = containerRect.width - greetingRect.width;
    
    let newOffset = e.touches[0].clientX - startX;
    
    // Constrain dragging within container bounds
    if (newOffset < maxLeft) newOffset = maxLeft;
    if (newOffset > maxRight) newOffset = maxRight;
    
    setDragOffset(newOffset);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <section className="mt-1">
      <div 
        ref={containerRef}
        className="w-full relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          ref={greetingRef}
          className={`bg-black flex text-gray-400 px-1.5 py-2 space-y-2.5 w-max rounded-t-xl absolute ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <h4 className="text-sm indent-1.5 font-semibold rounded select-none">
            Good Evening <span className="text-sm">🙂</span>
          </h4>
        </div>
        <div className="h-8"></div>
      </div>

      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden bg-black">
        <div className="absolute inset-0 bg-black" />

        {/* Slides content */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-all duration-2000 ease-in-out space-y-6 ${
              index === currentIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <h1 className="text-4xl text-brand w-full font-bold">Revolution <br/>...Brothers</h1>
            {/* <h1 className="text-4xl text-brand w-full font-bold">Revolution Brothers</h1> */}

            <h2 className="text-2xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {slide.title}
            </h2>
            <p className="text-lg md:text-2xl text-white/90 mb-12 drop-shadow-md">
              {slide.subtitle}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HeroCarousel;