"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const atmosphereSeeds = [
  { left: "14%", top: "72%", size: "6px", delay: "0s", duration: "12s" },
  { left: "22%", top: "66%", size: "4px", delay: "1.4s", duration: "11s" },
  { left: "33%", top: "78%", size: "5px", delay: "2.8s", duration: "13s" },
  { left: "48%", top: "68%", size: "6px", delay: "0.8s", duration: "10.5s" },
  { left: "61%", top: "74%", size: "4px", delay: "2.2s", duration: "11.8s" },
  { left: "73%", top: "62%", size: "5px", delay: "1.2s", duration: "12.5s" },
  { left: "84%", top: "70%", size: "6px", delay: "3.1s", duration: "10.8s" },
];

export default function SplitComparison() {
  const sectionRef = useRef(null);
  const dryLayerRef = useRef(null);
  const dryMediaRef = useRef(null);
  const healthyLayerRef = useRef(null);
  const healthyMediaRef = useRef(null);
  const glowLineRef = useRef(null);
  const scanBandRef = useRef(null);
  const atmosphereRef = useRef(null);
  const textLeftRef = useRef(null);
  const textRightRef = useRef(null);
  const statsRef = useRef(null);
  const headerMetaRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const reducedReveal = "polygon(0% 0%, 70% 0%, 70% 100%, 0% 100%)";
  const hiddenReveal = "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)";
  const initialClipPath = prefersReducedMotion ? reducedReveal : hiddenReveal;
  const initialLineLeft = prefersReducedMotion ? "70%" : "0%";

  useGSAP(
    () => {
      if (!sectionRef.current || prefersReducedMotion) return;

      const timeline = gsap
        .timeline({ defaults: { ease: "none" } })
        .fromTo(
          dryMediaRef.current,
          {
            scale: 1.12,
            filter: "brightness(0.72) saturate(0.65)",
          },
          {
            scale: 1.02,
            filter: "brightness(0.56) saturate(0.42)",
          },
          0
        )
        .fromTo(
          healthyLayerRef.current,
          {
            clipPath: hiddenReveal,
          },
          {
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
          },
          0
        )
        .fromTo(
          healthyMediaRef.current,
          {
            scale: 1.14,
            filter: "brightness(0.78) saturate(1.15)",
          },
          {
            scale: 1.02,
            filter: "brightness(1) saturate(1)",
          },
          0
        )
        .fromTo(
          glowLineRef.current,
          { left: "0%" },
          {
            left: "100%",
            ease: "none",
          },
          0
        )
        .fromTo(
          scanBandRef.current,
          {
            left: "0%",
            opacity: 0.25,
          },
          {
            left: "100%",
            opacity: 0.82,
            ease: "none",
          },
          0
        )
        .fromTo(
          atmosphereRef.current,
          { opacity: 0.28 },
          {
            opacity: 1,
            ease: "power1.out",
          },
          0.15
        )
        .to(
          textLeftRef.current,
          {
            opacity: 0,
            y: -30,
            x: -36,
            ease: "power2.in",
          },
          0.08
        )
        .fromTo(
          textRightRef.current,
          {
            opacity: 0,
            y: 28,
            x: 42,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            ease: "power2.out",
          },
          0.42
        )
        .fromTo(
          statsRef.current,
          {
            opacity: 0,
            y: 40,
          },
          {
            opacity: 1,
            y: 0,
            ease: "power2.out",
          },
          0.52
        )
        .fromTo(
          headerMetaRef.current,
          {
            opacity: 0.55,
            x: 0,
          },
          {
            opacity: 1,
            x: 22,
            ease: "power1.out",
          },
          0.45
        );

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=2200",
        pin: true,
        scrub: 1,
        animation: timeline,
        invalidateOnRefresh: true,
      });
    },
    { scope: sectionRef, dependencies: [prefersReducedMotion] }
  );

  return (
    <section ref={sectionRef} className="relative h-screen w-full overflow-hidden bg-[#06080b] font-sans text-[#EFECE6]">
      <div
        ref={dryLayerRef}
        className="absolute inset-0 h-full w-full overflow-hidden"
      >
        <div
          ref={dryMediaRef}
          className="absolute inset-0 flex h-full w-full items-center justify-center will-change-transform"
        >
          <Image
            src="/images/pod_dry_v2.png"
            alt="Потери от осыпания до ГРИПИЛ"
            fill
            sizes="100vw"
            className="object-cover opacity-60 mix-blend-luminosity grayscale-[0.18]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06080b]/95 via-[#06080b]/35 to-[#06080b]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_55%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_72%_42%,rgba(255,120,80,0.12),transparent_32%)]" />
        </div>
      </div>

      <div
        ref={healthyLayerRef}
        className="absolute inset-0 z-10 h-full w-full overflow-hidden will-change-[clip-path]"
        style={{ clipPath: initialClipPath }}
      >
        <div
          ref={healthyMediaRef}
          className="absolute inset-0 origin-left will-change-transform"
        >
          <Image
            src="/images/pod_healthy_v2.png"
            alt="Стручок под защитой мембраны ГРИПИЛ"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06080b]/85 via-transparent to-[#06080b]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_64%_46%,rgba(205,255,0,0.22),transparent_26%),radial-gradient(circle_at_78%_56%,rgba(239,236,230,0.12),transparent_24%)]" />
          <div className="absolute inset-0 bg-[#CDFF00]/7 mix-blend-overlay" />
        </div>
      </div>

      <div
        ref={atmosphereRef}
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.14]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_50%,rgba(205,255,0,0.12),transparent_34%),radial-gradient(circle_at_28%_52%,rgba(255,255,255,0.08),transparent_28%)]" />
        {atmosphereSeeds.map((seed) => (
          <span
            key={`${seed.left}-${seed.top}`}
            className="split-seed"
            style={{
              left: seed.left,
              top: seed.top,
              width: seed.size,
              height: seed.size,
              animationDelay: seed.delay,
              animationDuration: seed.duration,
            }}
          />
        ))}
      </div>

      <div
        ref={scanBandRef}
        className="pointer-events-none absolute inset-y-0 z-30 w-[28vw] max-w-[320px] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(205,255,0,0.14),rgba(239,236,230,0.12),transparent)] blur-2xl"
        style={{ left: initialLineLeft }}
      />

      <div
        ref={glowLineRef}
        className="split-scan-glow absolute top-0 z-40 h-full w-[2px] -translate-x-1/2 bg-[#CDFF00] shadow-[0_0_30px_4px_#CDFF00] will-change-transform"
        style={{ left: initialLineLeft }}
      />

      <div className="pointer-events-none absolute inset-0 z-50 mx-auto flex max-w-[1440px] flex-col justify-between px-5 py-10 sm:px-8 lg:px-16 lg:py-16">
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center rounded-full border border-[#EFECE6]/10 bg-[#EFECE6]/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#EFECE6]/60 backdrop-blur-sm">
              Технология защиты
            </div>
            <h2 className="font-display text-3xl font-medium leading-[1.05] tracking-tight [text-shadow:0_4px_32px_rgba(0,0,0,0.8)] sm:text-4xl md:text-5xl lg:text-6xl">
              Мембрана, которая
              <br />
              <span className="font-light italic text-[#CDFF00]">перехватывает риск</span>
            </h2>
          </div>

          <div
            ref={headerMetaRef}
            className="max-w-xs rounded-sm border border-[#EFECE6]/10 bg-[#06080b]/45 px-4 py-4 text-right backdrop-blur-md"
          >
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#EFECE6]/45">
              Scan Result
            </div>
            <div className="font-display text-3xl tracking-tight text-[#CDFF00]">21–28 дн</div>
            <p className="mt-2 text-sm leading-relaxed text-[#EFECE6]/62">
              Мембрана держит окно уборки живым и не душит дозревание стручка.
            </p>
          </div>
        </div>

        <div className="relative mt-auto mb-14 flex min-h-56 flex-col justify-end md:mb-20">
          <div ref={textLeftRef} className="max-w-md md:max-w-lg">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
              До применения
            </div>
            <div className="mb-4 font-display text-4xl font-light text-white md:text-5xl lg:text-[4rem]">
              Риск потерь
            </div>
            <p className="text-sm font-light leading-relaxed text-white/60 md:text-base">
              Сухой рапс раскрывается от ветра, дождя и механического удара. В последние дни до уборки поле теряет
              маржу буквально по шву стручка.
            </p>
          </div>

          <div
            ref={textRightRef}
            className="absolute right-0 max-w-md text-left opacity-0 md:max-w-lg md:text-right"
            style={prefersReducedMotion ? { opacity: 1, transform: "translateY(0px)" } : undefined}
          >
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[#CDFF00]/60">
              После ГРИПИЛ
            </div>
            <div className="mb-4 font-display text-4xl font-medium text-[#CDFF00] md:text-5xl lg:text-[4rem]">
              Мембрана активна
            </div>
            <p className="ml-auto text-sm font-light leading-relaxed text-white/82 md:text-base">
              Био-полимер фиксирует шов как эластичная лента: стручок держит удар, продолжает дышать и спокойно
              дотягивает до уборки.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col items-end gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center justify-center pb-4 md:pb-0">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#06080b]/40 px-6 py-3 text-xs uppercase tracking-widest text-[#EFECE6]/40 backdrop-blur-md">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#CDFF00]" />
              Скролл раскрывает защиту
            </div>
          </div>

          <div
            ref={statsRef}
            className="grid w-full max-w-xl gap-3 self-end md:grid-cols-3"
            style={prefersReducedMotion ? { opacity: 1, transform: "translateY(0px)" } : undefined}
          >
            {[
              { label: "Удар дождя", value: "ниже", detail: "шов не раскрывается при первом стрессе" },
              { label: "Сушка", value: "-", detail: "влажность уходит мягче и дешевле" },
              { label: "Уборочное окно", value: "+", detail: "есть запас по времени без паники" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-sm border border-[#EFECE6]/10 bg-[#06080b]/48 px-4 py-4 backdrop-blur-md"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#EFECE6]/42">{item.label}</div>
                <div className="mt-3 font-display text-3xl tracking-tight text-[#CDFF00]">{item.value}</div>
                <p className="mt-2 text-sm leading-relaxed text-[#EFECE6]/62">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
