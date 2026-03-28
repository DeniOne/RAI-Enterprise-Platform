"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Template({ children }: { children: React.ReactNode }) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    // Страница плавно появляется - используем requestAnimationFrame
    // чтобы гарантированно дожидаться монтирования DOM
    const raf = requestAnimationFrame(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          clearProps: "all",
        }
      );
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    // autoAlpha управляет visibility + opacity одновременно через GSAP
    // НЕ ставим opacity:0 инлайново - это убивает контент при медленном JS
    <div ref={pageRef}>
      {children}
    </div>
  );
}
