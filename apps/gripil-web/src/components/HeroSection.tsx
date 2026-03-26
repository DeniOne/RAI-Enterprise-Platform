"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Play, Target } from "lucide-react";
import Image from "next/image";

export default function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, { damping: 20, stiffness: 50 });
  const scale = useTransform(smoothProgress, [0, 1], [1, 1.1]);
  const yImage = useTransform(smoothProgress, [0, 1], ["0%", "15%"]);
  const yText = useTransform(smoothProgress, [0, 1], ["0%", "40%"]);
  const opacityText = useTransform(smoothProgress, [0, 0.5], [1, 0]);

  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setPos({ x: x * 0.15, y: y * 0.15 });
    }
  };

  const handlePointerLeave = () => {
    setPos({ x: 0, y: 0 });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative w-full min-h-screen flex items-center overflow-hidden bg-[#EFECE6] font-sans py-20 md:py-0"
    >
      {/* Background */}
      <motion.div 
        style={{ scale, y: yImage, willChange: 'transform' }}
        className="absolute inset-0 z-0 origin-center"
      >
        <Image 
          src="/images/hero.png" 
          alt="Поле" 
          fill 
          priority
          quality={100}
          className="object-cover object-center filter brightness-[0.80] contrast-[1.1]"
        />
        {/* Более плотный градиент для читаемости курсива */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#112118]/90 via-[#112118]/60 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#EFECE6] via-transparent to-transparent z-10" />
      </motion.div>

      {/* Main Content Container */}
      <motion.div 
        style={{ y: yText, opacity: opacityText, willChange: 'transform, opacity' }}
        className="relative z-20 w-full max-w-[1600px] mx-auto px-5 sm:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12"
      >
        {/* Left Column: Typography */}
        <div className="w-full md:w-8/12 lg:w-7/12 text-left">
          
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "3rem" }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] as any }}
            className="h-[1px] bg-[#CDFF00] mb-8"
          />

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[6rem] 2xl:text-[7.5rem] font-display font-medium tracking-tight leading-[0.95] text-[#EFECE6] mb-6 md:mb-10 [text-shadow:0_4px_32px_rgba(0,0,0,0.5)]"
          >
            Сохраните то,<br />
            <span className="italic font-light text-[#EFECE6]/90 text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] xl:text-[5rem] 2xl:text-[6.5rem]">
              что вырастили
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
            className="text-base sm:text-lg md:text-xl 2xl:text-2xl text-[#EFECE6]/80 max-w-lg 2xl:max-w-2xl font-sans font-light leading-relaxed mb-8 md:mb-14 [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]"
          >
            Био-комплекс ГРИПИЛ формирует <strong className="font-normal text-white">дышащую мембрану</strong>, останавливая растрескивание стручков и спасая ваши инвестиции в гектар.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] as any }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <motion.button
              ref={btnRef}
              onPointerMove={handlePointerMove}
              onPointerLeave={handlePointerLeave}
              whileHover={{ scale: 1.02 }}
              animate={{ x: pos.x, y: pos.y }}
              onClick={() => document.getElementById('calc-section')?.scrollIntoView({ behavior: 'smooth' })}
              transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
              className="relative flex items-center justify-center gap-3 px-8 lg:px-10 py-4 lg:py-5 bg-[#CDFF00] text-[#112118] font-medium rounded-sm overflow-hidden w-full sm:w-auto hover:bg-[#b0d900] transition-colors shadow-lg shadow-[#CDFF00]/20"
            >
              <span className="relative z-10 flex items-center gap-2 text-sm lg:text-base uppercase tracking-widest">
                Рассчитать выгоду
                <ArrowRight className="w-4 h-4 ml-2" />
              </span>
            </motion.button>
            
            {/* Усиленный Ghost CTA */}
            <button 
              onClick={() => document.getElementById('problem-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center justify-center gap-3 px-6 py-4 lg:py-5 text-white font-medium rounded-sm hover:bg-white/10 transition-colors w-full sm:w-auto group bg-black/20 backdrop-blur-sm border border-white/10"
            >
              <span className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white text-black group-hover:scale-110 transition-transform">
                <Play className="w-3 h-3 lg:w-4 lg:h-4 ml-1" />
              </span>
              <span className="text-sm lg:text-base uppercase tracking-widest whitespace-nowrap">Смотреть технологию</span>
            </button>
          </motion.div>
        </div>

        {/* Right Column: Data Overlays (Agro-Tech Neon) */}
        <div className="w-full md:w-5/12 hidden md:flex flex-col items-end gap-12 pr-4 lg:pr-12">
          
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 1, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-72 2xl:w-80 relative"
          >
            <div className="absolute -left-12 top-1/2 w-12 h-[1px] bg-gradient-to-r from-transparent to-[#CDFF00]/50" />
            <div className="absolute -left-12 top-1/2 w-1.5 h-1.5 rounded-full bg-[#CDFF00] shadow-[0_0_10px_#CDFF00] animate-pulse -translate-y-[2px]" />
            
            <div className="backdrop-blur-md bg-[#112118]/70 border border-[#CDFF00]/30 p-5 2xl:p-6 rounded-sm shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs 2xl:text-sm text-[#EFECE6]/80 uppercase tracking-widest font-mono font-medium">Риск осыпания</span>
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#CDFF00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#CDFF00]"></span>
                </span>
              </div>
              <p className="text-[#CDFF00] font-mono text-xl 2xl:text-2xl font-medium">Активен (7-12 дн)</p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, delay: 1.2, ease: [0.16, 1, 0.3, 1] as any }}
            className="w-80 2xl:w-96 relative"
          >
            <div className="absolute -left-24 top-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent to-[#EFECE6]/40" />
            <div className="absolute -left-24 top-1/2 w-1.5 h-1.5 rounded-full bg-[#EFECE6] shadow-[0_0_10px_#ffffff] animate-pulse -translate-y-[2px]" />
            
            <div className="backdrop-blur-md bg-[#112118]/50 border border-[#EFECE6]/20 p-6 2xl:p-8 rounded-sm shadow-2xl hover:border-[#CDFF00]/40 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-[#CDFF00]" />
                <span className="text-xs 2xl:text-sm text-[#EFECE6]/80 uppercase tracking-widest font-mono font-medium">ROI потенциал</span>
              </div>
              <div className="text-4xl 2xl:text-5xl text-white font-display mb-1">+3,5 ц/га</div>
              <div className="text-sm 2xl:text-base font-light text-[#EFECE6]/60 tracking-wide uppercase">сохранено</div>
              <div className="w-full h-1 bg-[#EFECE6]/10 mt-5 relative rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
                  className="absolute left-0 top-0 h-full bg-[#CDFF00]" 
                />
              </div>
            </div>
          </motion.div>

        </div>

      </motion.div>
    </section>
  );
}
