"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EMPHATIC_EASE } from "@/lib/motion";

type Particle = { id: number; r: number; x: number; d: number; yStart: number };

function createSeededRandom(seed: number) {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createParticles(count: number): Particle[] {
  const random = createSeededRandom(20260328);

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    r: random() * 3 + 1,
    x: random() * 100,
    yStart: random() * 100 + 10,
    d: random() * 10 + 12,
  }));
}

function Particles({ reducedMotion }: { reducedMotion: boolean }) {
  const [elements] = useState<Particle[]>(() => createParticles(reducedMotion ? 0 : 18));

  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute rounded-full bg-[#CDFF00] opacity-40 blur-[1px]"
          style={{
            width: el.r,
            height: el.r,
            left: `${el.x}%`,
            top: `${el.yStart}%`,
          }}
          animate={{ y: ["0vh", "-100vh"], x: ["-20px", "20px", "-20px"] }}
          transition={{
            y: {
              duration: el.d,
              repeat: Infinity,
              ease: "linear",
            },
            x: {
              duration: el.d / 2,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "mirror",
            },
          }}
        />
      ))}
    </div>
  );
}

export default function EcologySection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [prefersReducedMotion]);

  return (
    <section className="relative flex flex-col lg:flex-row bg-[#112118] overflow-hidden border-t border-[#CDFF00]/10">
      
      {/* Левая колонка - Типографика и Контент (50%) */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex items-center justify-center p-6 sm:p-8 lg:p-12 xl:p-16 relative z-20">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: EMPHATIC_EASE }}
          className="max-w-xl w-full"
        >
          <div className="mb-6 flex items-center gap-4">
             <div className="w-12 h-[1px] bg-[#CDFF00]/60" />
             <span className="text-[#CDFF00] font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs font-mono">
               100% Биоразлагаемость
             </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-display font-medium tracking-tight leading-[1.05] mb-5 text-[#EFECE6] [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
            Безопасно для <br />
            <span className="text-[#CDFF00] italic font-light">пчел и экологии</span>
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-[#EFECE6]/70 font-light leading-relaxed mb-6 lg:mb-8">
            В отличие от синтетических клеев и жестких химических десикантов, ГРИПИЛ создан на основе натуральных хвойных экстрактов. 
          </p>

          <ul className="space-y-6">
             {[
               "Пленка полностью разрушается УФ-лучами за 4 недели",
               "Не оставляет микропластика в почве",
               "Абсолютно нетоксичен для насекомых-опылителей"
             ].map((text, idx) => (
               <li key={idx} className="flex items-start gap-5 group">
                 <div className="w-6 h-6 mt-1 rounded-sm bg-[#CDFF00]/10 border border-[#CDFF00]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(205,255,0,0.15)] group-hover:bg-[#CDFF00]/20 transition-colors">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#CDFF00]" />
                 </div>
                 <span className="text-[#EFECE6]/90 font-light leading-relaxed text-base">{text}</span>
               </li>
             ))}
          </ul>
        </motion.div>
      </div>

      {/* Правая колонка - Живое Видео / Фото (50%) */}
      <div className="w-full lg:w-[55%] xl:w-[60%] relative min-h-[45vh] lg:min-h-[600px] z-10 overflow-hidden bg-black">
        {/* Градиенты слияния для бесшовного перехода */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#112118] to-transparent z-10 hidden lg:block" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#112118] to-transparent z-10 lg:hidden" />
        
        {/* Цветной оверлей для стиля */}
        <div className="absolute inset-0 bg-[#CDFF00]/5 mix-blend-overlay z-10 pointer-events-none" />

        {/* Кинематографичная Пыльца поверх видео */}
        <Particles reducedMotion={prefersReducedMotion} />

        {/* Видео-фон. Если видео нет, браузер покажет poster (фотографию). Чтобы вставить видео, просто кинь bee.mp4 в public/videos/ */}
        <video 
          ref={videoRef}
          autoPlay={!prefersReducedMotion}
          loop 
          muted 
          playsInline 
          preload="none"
          poster="/images/ecology.webp"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90"
        >
          <source src="/videos/bee.mp4" type="video/mp4" />
        </video>
        
      </div>
    </section>
  );
}
