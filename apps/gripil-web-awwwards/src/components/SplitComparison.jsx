"use client";

import React, { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function SplitComparison() {
  const sectionRef = useRef(null);
  const healthyLayerRef = useRef(null);
  const glowLineRef = useRef(null);
  const textLeftRef = useRef(null);
  const textRightRef = useRef(null);
  
  useGSAP(() => {
    if (!sectionRef.current) return;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "+=2000",
      pin: true,
      scrub: 1,
      animation: gsap.timeline()
        // GSAP Clip-Path wipe effect - Hardware Accelerated and Zero layout thrashing
        .fromTo(healthyLayerRef.current, {
          clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",
        }, {
          clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          ease: "none",
        }, 0)
        // Moving glow line synchronously
        .fromTo(glowLineRef.current, {
          left: "0%",
        }, {
          left: "100%",
          ease: "none",
        }, 0)
        // Typography logic
        .to(textLeftRef.current, {
          opacity: 0,
          y: -20,
          ease: "power2.in",
        }, 0)
        .fromTo(textRightRef.current, {
          opacity: 0,
          y: 20
        }, {
          opacity: 1,
          y: 0,
          ease: "power2.out",
        }, 0.5)
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className="relative h-screen w-full bg-[#06080b] overflow-hidden text-[#EFECE6] font-sans">
      
      {/* BASE LAYER (Dry Pod without Gripil) */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <Image 
          src="/images/pod_dry_v2.png" 
          alt="Потери от осыпания до ГРИПИЛ" 
          fill 
          className="object-cover opacity-60 mix-blend-luminosity grayscale-[0.2]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080b]/90 via-[#06080b]/40 to-[#06080b]/80" />
      </div>

      {/* REVEAL LAYER (Healthy Pod with Gripil) */}
      <div 
        ref={healthyLayerRef}
        className="absolute inset-0 w-full h-full z-10 origin-left will-change-[clip-path]"
        style={{ clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }}
      >
        <Image 
          src="/images/pod_healthy_v2.png" 
          alt="Стручок под защитой мембраны ГРИПИЛ" 
          fill 
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080b]/90 via-transparent to-[#06080b]/80" />
        <div className="absolute inset-0 bg-[#CDFF00]/5 mix-blend-overlay" />
      </div>

      {/* THE GLOW LINE SCANNER */}
      <div 
        ref={glowLineRef}
        className="absolute top-0 w-[2px] h-full bg-[#CDFF00] shadow-[0_0_25px_4px_#CDFF00] z-15 will-change-transform"
        style={{ left: "0%" }}
      />

      {/* TYPOGRAPHY UI */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16 py-10 lg:py-16 pointer-events-none">
        
        {/* Header */}
        <div className="w-full flex justify-between items-start">
          <div className="max-w-xl">
             <div className="mb-4 inline-flex items-center rounded-full border border-[#EFECE6]/10 bg-[#EFECE6]/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#EFECE6]/60 backdrop-blur-sm">
                 Технология защиты
             </div>
             <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-medium tracking-tight leading-[1.05] [text-shadow:0_4px_32px_rgba(0,0,0,0.8)]">
                Кинематический щит <br/>
                <span className="text-[#CDFF00] italic font-light">от осыпания</span>
             </h2>
          </div>
        </div>

        {/* Dynamic Typography States */}
        <div className="w-full relative flex items-center justify-between mt-auto mb-20 h-48">
          
          {/* Left State */}
          <div ref={textLeftRef} className="absolute left-0 w-full md:w-1/2 lg:w-1/3">
             <div className="text-[11px] uppercase tracking-[0.22em] text-white/40 mb-3 font-mono">До применения</div>
             <div className="text-4xl md:text-5xl lg:text-[4rem] font-display font-light text-white mb-4">Риск потерь</div>
             <p className="text-white/60 text-sm md:text-base leading-relaxed font-light">
                Сухой рапс лопается от ветра и дождя. Потери могут достигать критических значений в последние дни перед уборкой. Семена выпадают на почву.
             </p>
          </div>

          {/* Right State */}
          <div ref={textRightRef} className="absolute right-0 w-full md:w-1/2 lg:w-1/3 text-right opacity-0 translate-y-8">
             <div className="text-[11px] uppercase tracking-[0.22em] text-[#CDFF00]/60 mb-3 font-mono">После ГРИПИЛ</div>
             <div className="text-4xl md:text-5xl lg:text-[4rem] font-display font-medium text-[#CDFF00] mb-4">Мембрана активна</div>
             <p className="text-white/80 text-sm md:text-base leading-relaxed font-light ml-auto">
                Био-полимер стягивает шов стручка как эластичная лента. Полная устойчивость к растрескиванию при сохранении дыхания растения.
             </p>
          </div>

        </div>

        {/* Footer Hint */}
        <div className="flex w-full items-center justify-center pointer-events-none pb-4 md:pb-0">
           <div className="rounded-full border border-white/10 bg-[#06080b]/40 px-6 py-3 text-xs uppercase tracking-widest text-[#EFECE6]/40 backdrop-blur-md flex items-center gap-2">
              <span className="animate-pulse inline-block w-1.5 h-1.5 bg-[#CDFF00] rounded-full" />
              Keep Scrolling
           </div>
        </div>
      </div>

    </section>
  );
}
