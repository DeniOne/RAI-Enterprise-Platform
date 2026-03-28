"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLenis } from "lenis/react";
import { EMPHATIC_EASE } from "@/lib/motion";

function collectSections() {
  return Array.from(document.querySelectorAll("header, section, footer")).filter(
    (element): element is HTMLElement => element instanceof HTMLElement && element.offsetHeight > 50
  );
}

function resolveActiveIndex(sections: HTMLElement[]) {
  if (sections.length === 0) return 0;

  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const viewportOffset = viewportHeight / 3;
  let nextIndex = 0;

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const absoluteTop = section.getBoundingClientRect().top + window.scrollY;

    if (scrollY >= absoluteTop - viewportOffset) {
      nextIndex = index;
    }
  }

  const isAtBottom = Math.ceil(scrollY + viewportHeight) >= document.documentElement.scrollHeight - 5;
  return isAtBottom ? sections.length - 1 : nextIndex;
}

export default function ScrollNavigation() {
  const lenis = useLenis();
  const sectionsRef = useRef<HTMLElement[]>([]);
  const frameRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);
  const isAnimating = useRef(false);
  const [sectionCount, setSectionCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const syncSections = useCallback(() => {
    const sections = collectSections();
    sectionsRef.current = sections;
    setSectionCount((current) => (current === sections.length ? current : sections.length));

    if (!isAnimating.current) {
      const nextIndex = resolveActiveIndex(sections);
      setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
    }
  }, []);

  const requestSync = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      syncSections();
    });
  }, [syncSections]);

  useEffect(() => {
    requestSync();

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }

      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, [requestSync]);

  const transitionTo = useCallback(
    (index: number) => {
      const sections = sectionsRef.current;

      if (index < 0 || index >= sections.length || isAnimating.current) return;

      const targetSection = sections[index];

      if (!targetSection) return;

      isAnimating.current = true;
      setActiveIndex(index);

      const finishTransition = () => {
        isAnimating.current = false;
        requestSync();
      };

      if (fallbackTimeoutRef.current !== null) {
        window.clearTimeout(fallbackTimeoutRef.current);
      }

      if (lenis) {
        lenis.scrollTo(targetSection, {
          duration: 1.05,
          easing: (progress: number) => 1 - Math.pow(1 - progress, 3),
          lock: true,
          onComplete: finishTransition,
        });
        return;
      }

      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      fallbackTimeoutRef.current = window.setTimeout(finishTransition, 950);
    },
    [lenis, requestSync]
  );

  const isAtTop = activeIndex === 0;
  const isAtBottom = activeIndex === Math.max(0, sectionCount - 1);

  if (sectionCount < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1, ease: EMPHATIC_EASE }}
        className="pointer-events-none fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 md:flex sm:right-6 lg:right-10"
      >
        <div className="pointer-events-auto flex flex-col items-center gap-3">
          <button
            onClick={() => transitionTo(activeIndex - 1)}
            disabled={isAtTop}
            className={`group flex h-10 w-10 flex-col items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 lg:h-12 lg:w-12 ${
              isAtTop
                ? "cursor-not-allowed border-[#112118]/10 bg-black/20 opacity-30"
                : "cursor-pointer border-[#EFECE6]/20 bg-[#112118]/60 opacity-100 hover:border-[#CDFF00]/50 hover:bg-[#112118]/80 hover:shadow-[0_0_15px_rgba(205,255,0,0.2)]"
            }`}
          >
            <ChevronUp
              className={`h-5 w-5 transition-colors duration-300 lg:h-6 lg:w-6 ${
                isAtTop ? "text-[#EFECE6]/50" : "text-[#EFECE6] group-hover:text-[#CDFF00]"
              }`}
            />
          </button>

          <div className="relative my-2 h-16 w-[1px] bg-[#EFECE6]/20">
            <motion.div
              className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-[#CDFF00] shadow-[0_0_8px_rgba(205,255,0,0.6)]"
              initial={false}
              animate={{
                top: `${(activeIndex / Math.max(1, sectionCount - 1)) * 100}%`,
                height: "20%",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ top: 0, translateY: "-50%" }}
            />
          </div>

          <button
            onClick={() => transitionTo(activeIndex + 1)}
            disabled={isAtBottom}
            className={`group flex h-10 w-10 flex-col items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 lg:h-12 lg:w-12 ${
              isAtBottom
                ? "cursor-not-allowed border-[#112118]/10 bg-black/20 opacity-30"
                : "cursor-pointer border-[#EFECE6]/20 bg-[#112118]/60 opacity-100 hover:border-[#CDFF00]/50 hover:bg-[#112118]/80 hover:shadow-[0_0_15px_rgba(205,255,0,0.2)]"
            }`}
          >
            <ChevronDown
              className={`h-5 w-5 transition-colors duration-300 lg:h-6 lg:w-6 ${
                isAtBottom ? "text-[#EFECE6]/50" : "text-[#EFECE6] group-hover:text-[#CDFF00]"
              }`}
            />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
