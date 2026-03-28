"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Не показываем на мобилках (touch devices)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    if (!cursorRef.current || !dotRef.current) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;

    // GSAP quickTo для сверхплавного фолловинга на 120Hz
    const cursorX = gsap.quickTo(cursor, "x", { duration: 0.3, ease: "power3", easeParams: [1, 0.5] });
    const cursorY = gsap.quickTo(cursor, "y", { duration: 0.3, ease: "power3", easeParams: [1, 0.5] });
    
    // Точка следует мгновенно через quickSetter
    const dotX = gsap.quickSetter(dot, "x", "px");
    const dotY = gsap.quickSetter(dot, "y", "px");

    let firstMove = true;

    const moveCursor = (e: MouseEvent) => {
      if (firstMove) {
        // Устанавливаем мгновенно позицию при первом движении, чтобы кольцо не летело из угла
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        firstMove = false;
      } else {
        cursorX(e.clientX);
        cursorY(e.clientY);
      }
      
      dotX(e.clientX);
      dotY(e.clientY);
      
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Hover effects
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        gsap.to(cursor, { 
          scale: 1.8, 
          backgroundColor: "rgba(205, 255, 0, 0.15)", // CDFF00
          borderColor: "rgba(205, 255, 0, 0)",
          duration: 0.25,
          ease: "back.out(1.5)"
        });
        gsap.to(dot, { scale: 0, duration: 0.15 });
      } 
      // Text interactions
      else if (
        target.tagName.toLowerCase() === "p" ||
        target.tagName.toLowerCase() === "h1" ||
        target.tagName.toLowerCase() === "h2" ||
        target.tagName.toLowerCase() === "h3"
      ) {
        gsap.to(cursor, { 
          scale: 1.5, 
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderColor: "rgba(255, 255, 255, 0)", 
          duration: 0.25 
        });
        gsap.to(dot, { scale: 1, duration: 0.15 });
      } else {
        // Return to default
        gsap.to(cursor, { 
          scale: 1, 
          backgroundColor: "transparent", 
          borderColor: "rgba(255, 255, 255, 0.2)",
          duration: 0.25 
        });
        gsap.to(dot, { scale: 1, duration: 0.15 });
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isVisible]);

  return (
    <>
      {/* Маленькая точка */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-[#CDFF00] pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#CDFF00]"
        style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.2s" }}
      />
      {/* Кольцо GSAP (намного легче для рендеринга без mix-blend-mode difference для всего блока) */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-white/20 pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.2s" }}
      />
    </>
  );
}
