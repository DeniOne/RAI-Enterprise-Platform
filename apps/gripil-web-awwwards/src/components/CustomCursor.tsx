"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  // States: 'default', 'pointer', 'text'
  const [cursorVariant, setCursorVariant] = useState("default");

  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Пружинистый след (кольцо)
  const springX = useSpring(mouseX, { stiffness: 350, damping: 28 });
  const springY = useSpring(mouseY, { stiffness: 350, damping: 28 });

  useEffect(() => {
    // Не показываем на мобилках (touch devices)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Если навели на ссылку или кнопку
      if (
        target.tagName.toLowerCase() === "a" ||
        target.tagName.toLowerCase() === "button" ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setCursorVariant("pointer");
      } 
      // Если навели на текст (p, h1, h2, h3, span без клика)
      else if (
        target.tagName.toLowerCase() === "p" ||
        target.tagName.toLowerCase() === "h1" ||
        target.tagName.toLowerCase() === "h2" ||
        target.tagName.toLowerCase() === "h3"
      ) {
        setCursorVariant("text");
      } else {
        setCursorVariant("default");
      }
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);
    document.documentElement.addEventListener("mouseenter", () => setIsVisible(true));

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.removeEventListener("mouseenter", () => setIsVisible(true));
    };
  }, [mouseX, mouseY, isVisible]);

  // Размеры курсора в зависимости от варианта
  const variants = {
    default: {
      height: 32,
      width: 32,
      backgroundColor: "transparent",
      mixBlendMode: "difference" as const,
    },
    pointer: {
      height: 50,
      width: 50,
      backgroundColor: "rgba(205, 255, 0, 0.2)",
      mixBlendMode: "normal" as const,
    },
    text: {
      height: 64,
      width: 64,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      mixBlendMode: "difference" as const,
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Маленькая жесткая точка по центру (всегда difference) */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-white pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
      {/* Пружинистое кольцо / подложка */}
      <motion.div
        className="fixed top-0 left-0 rounded-full border border-white pointer-events-none z-[9998]"
        variants={variants}
        animate={cursorVariant}
        transition={{ type: "tween", ease: "backOut", duration: 0.2 }}
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
