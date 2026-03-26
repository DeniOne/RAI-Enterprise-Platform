"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import CountUp from "./ui/CountUp";

export default function YieldCalculator() {
  const [area, setArea] = useState(1000); // Гектары
  const [yieldPerHa, setYieldPerHa] = useState(25); // Ц/га
  const [price, setPrice] = useState(45000); // Руб/тонна

  const lossPercentage = 15; 
  const totalYieldTon = (area * yieldPerHa) / 10;
  const lossTon = totalYieldTon * (lossPercentage / 100);
  const savedMoney = lossTon * price;

  const costPerHa = 1500; 
  const totalCost = area * costPerHa;
  const netProfit = savedMoney - totalCost;
  const roi = ((netProfit / totalCost) * 100).toFixed(0);

  return (
    <section className="relative py-32 md:py-48 bg-[#112118] text-[#EFECE6] overflow-hidden font-sans">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/shattered.png" 
          alt="Потери на почве" 
          fill 
          priority
          quality={80}
          className="object-cover object-bottom filter brightness-[0.3] contrast-125 saturate-50"
        />
        <div className="absolute inset-0 bg-[#112118]/80 mix-blend-multiply" />
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-[#112118] to-transparent" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Editorial Text Block */}
        <div className="lg:col-span-6 w-full relative z-20 pr-0 lg:pr-12">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "3rem" }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
            className="h-[1px] bg-[#CDFF00] mb-8"
          />

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.1 }}
            className="text-5xl lg:text-[5rem] font-display font-medium tracking-tight leading-[1.05] mb-8 text-[#EFECE6]"
          >
            Урожай — ваш,<br/>
            до тех пор пока не <span className="italic font-light text-[#EFECE6]/70">упал</span>.
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.2 }}
            className="text-xl text-[#EFECE6]/60 font-light leading-relaxed max-w-lg mb-12"
          >
            Возьмите цифры под контроль. Дашборд прогнозирует чистую экономию с учетом затрат на обработку мембраной ГРИПИЛ.
          </motion.p>
        </div>

        {/* Dashboard: Heavy Glassmorphism Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.3 }}
          className="lg:col-span-6 w-full bg-[#112118]/40 backdrop-blur-2xl border border-[#EFECE6]/10 p-8 md:p-12 shadow-2xl relative overflow-hidden group"
        >
          {/* Neon Top Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CDFF00]/50 to-transparent opacity-50" />

          {/* Sliders Area */}
          <div className="space-y-12 mb-16 relative z-10">
            <div>
              <div className="flex justify-between items-end mb-6 pb-2">
                <label className="text-sm md:text-base 2xl:text-lg font-mono tracking-[0.1em] uppercase text-[#EFECE6]/70">Площадь посева (Га)</label>
                <span className="text-3xl md:text-4xl 2xl:text-5xl font-display text-[#EFECE6] leading-none">{area.toLocaleString('ru-RU')}</span>
              </div>
              <input 
                type="range" min="100" max="10000" step="100" value={area} onChange={(e) => setArea(Number(e.target.value))}
                className="w-full h-1 bg-[#EFECE6]/20 appearance-none cursor-pointer accent-[#CDFF00] focus:outline-none transition-all hover:h-1.5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#CDFF00] [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-end mb-6 pb-2">
                <label className="text-sm md:text-base 2xl:text-lg font-mono tracking-[0.1em] uppercase text-[#EFECE6]/70">Урожайность (Ц/Га)</label>
                <span className="text-3xl md:text-4xl 2xl:text-5xl font-display text-[#EFECE6] leading-none">{yieldPerHa}</span>
              </div>
              <input 
                type="range" min="10" max="60" step="1" value={yieldPerHa} onChange={(e) => setYieldPerHa(Number(e.target.value))}
                className="w-full h-1 bg-[#EFECE6]/20 appearance-none cursor-pointer accent-[#CDFF00] focus:outline-none transition-all hover:h-1.5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#CDFF00] [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
            <div>
              <div className="flex justify-between items-end mb-6 pb-2">
                <label className="text-sm md:text-base 2xl:text-lg font-mono tracking-[0.1em] uppercase text-[#EFECE6]/70">Цена рапса (Руб/Тн)</label>
                <span className="text-3xl md:text-4xl 2xl:text-5xl font-display text-[#EFECE6] leading-none">{price.toLocaleString('ru-RU')}</span>
              </div>
              <input 
                type="range" min="20000" max="80000" step="1000" value={price} onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full h-1 bg-[#EFECE6]/20 appearance-none cursor-pointer accent-[#CDFF00] focus:outline-none transition-all hover:h-1.5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-[#CDFF00] [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>

          {/* Output Metric */}
          <div className="relative z-10 bg-[#112118]/60 border border-[#CDFF00]/20 p-8 2xl:p-10 rounded-sm">
            <p className="text-[#EFECE6]/60 text-sm 2xl:text-base font-mono tracking-widest uppercase mb-6">Сохраненная выручка (Чистая)</p>
            <div>
              <span className="text-6xl md:text-7xl 2xl:text-8xl font-display font-medium text-[#CDFF00] tabular-nums tracking-tight">
                 <CountUp to={netProfit} duration={1} suffix=" ₽" />
              </span>
            </div>
            
            <div className="mt-8 grid grid-cols-2 divide-x divide-[#EFECE6]/20 pt-6 border-t border-[#CDFF00]/10">
              <div className="pr-4">
                <p className="text-xs 2xl:text-sm text-[#EFECE6]/50 uppercase tracking-widest font-mono mb-2">ROI</p>
                <p className="text-3xl 2xl:text-4xl font-display text-[#EFECE6]">+{roi}%</p>
                <p className="text-[11px] 2xl:text-xs text-[#EFECE6]/40 mt-1 uppercase font-mono tracking-widest">при настройках выше</p>
              </div>
              <div className="pl-6 flex flex-col justify-end">
                <p className="text-xs 2xl:text-sm text-[#EFECE6]/50 uppercase tracking-widest font-mono mb-2">Инвестиция в ГРИПИЛ</p>
                <p className="text-3xl 2xl:text-4xl font-display text-[#EFECE6]/80">-{(totalCost / 1000000).toFixed(2)}М ₽</p>
              </div>
            </div>
          </div>

          {/* Ambient Glow */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#CDFF00]/[0.02] to-transparent pointer-events-none group-hover:from-[#CDFF00]/[0.05] transition-all duration-700" />
        </motion.div>
      </div>
    </section>
  );
}
