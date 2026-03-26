"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

// Умное форматирование: компактное для вывода — не вылезает за контейнер
function formatMln(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + " МЛН";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + " ТЫС";
  return n.toLocaleString("ru-RU");
}

// Кастомный слайдер — никакого браузерного дефолта
interface SliderRowProps {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, displayValue, min, max, step, onChange }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-[10px] sm:text-xs font-mono tracking-[0.14em] uppercase text-[#EFECE6]/45">
          {label}
        </span>
        <span className="text-lg sm:text-2xl md:text-3xl font-display text-[#EFECE6] tabular-nums leading-none pl-3">
          {displayValue}
        </span>
      </div>
      {/* Track + fill + thumb */}
      <div className="relative h-[2px] bg-[#EFECE6]/10 w-full">
        <div
          className="absolute left-0 top-0 h-full bg-[#CDFF00] transition-all duration-100"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-[#CDFF00] shadow-[0_0_8px_rgba(205,255,0,0.6)] transition-all duration-100"
          style={{ left: `${pct}%` }}
        />
        {/* Invisible native input for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 touch-action-none"
          style={{ margin: 0, padding: 0 }}
        />
      </div>
    </div>
  );
}

export default function YieldCalculator() {
  const [area, setArea] = useState(1000);
  const [yieldPerHa, setYieldPerHa] = useState(25);
  const [price, setPrice] = useState(45000);

  const lossPercentage = 15;
  const totalYieldTon = (area * yieldPerHa) / 10;
  const lossTon = totalYieldTon * (lossPercentage / 100);
  const savedMoney = lossTon * price;
  const costPerHa = 1500;
  const totalCost = area * costPerHa;
  const netProfit = Math.max(0, savedMoney - totalCost);
  const roi = ((netProfit / totalCost) * 100).toFixed(0);
  const savedPerHa = Math.max(0, netProfit / area);

  return (
    <section className="relative py-10 md:py-14 lg:py-20 bg-[#112118] text-[#EFECE6] overflow-hidden font-sans">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/shattered.png"
          alt="Потери на почве"
          fill
          priority
          quality={80}
          className="object-cover object-bottom filter brightness-[0.25] contrast-125 saturate-50"
        />
        <div className="absolute inset-0 bg-[#112118]/75 mix-blend-multiply" />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#112118] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#112118] to-transparent" />
      </div>

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

        {/* Left: Editorial Text */}
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "3rem" }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
            className="h-[1px] bg-[#CDFF00] mb-6 lg:mb-8"
          />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-display font-medium tracking-tight leading-[1.05] mb-4 lg:mb-6 text-[#EFECE6]"
          >
            Урожай — ваш, до тех пор пока не <span className="italic font-light text-[#EFECE6]/65">упал</span>.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-[#EFECE6]/55 font-light leading-relaxed max-w-sm lg:max-w-md"
          >
            Введите параметры хозяйства — дашборд рассчитает чистую выгоду от мембраны ГРИПИЛ с учётом всех затрат.
          </motion.p>

          {/* Desktop: тизер потерь */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex items-center gap-3 mt-6 pt-5 sm:mt-8 sm:pt-6 border-t border-[#EFECE6]/10"
          >
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            <span className="text-xs font-mono tracking-widest uppercase text-[#EFECE6]/40">
              Среднестатистические потери без защиты: 12–18% урожая
            </span>
          </motion.div>
        </div>

        {/* Right: Calculator Panel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any, delay: 0.3 }}
          className="w-full"
        >
          <div className="relative bg-[#0C1810]/80 backdrop-blur-2xl border border-[#EFECE6]/8 overflow-hidden">
            {/* Neon accent top */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CDFF00]/50 to-transparent" />

            {/* Sliders block */}
            <div className="px-5 sm:px-6 md:px-8 pt-5 sm:pt-6 pb-5 sm:pb-6 space-y-4 sm:space-y-6 border-b border-[#EFECE6]/5">
              <SliderRow
                label="Площадь посева (га)"
                value={area}
                displayValue={area.toLocaleString("ru-RU")}
                min={100} max={10000} step={100}
                onChange={setArea}
              />
              <SliderRow
                label="Урожайность (ц/га)"
                value={yieldPerHa}
                displayValue={String(yieldPerHa)}
                min={10} max={60} step={1}
                onChange={setYieldPerHa}
              />
              <SliderRow
                label="Цена рапса (руб/тн)"
                value={price}
                displayValue={price.toLocaleString("ru-RU")}
                min={20000} max={80000} step={1000}
                onChange={setPrice}
              />
            </div>

            {/* Result block */}
            <div className="px-5 sm:px-6 md:px-8 pt-4 sm:pt-5 pb-5 sm:pb-6">
              <p className="text-[10px] sm:text-xs font-mono tracking-[0.16em] uppercase text-[#EFECE6]/35 mb-2 sm:mb-3">
                Чистая выгода от ГРИПИЛ
              </p>

              {/* Main number – не вылезает */}
              <div className="flex items-baseline gap-1.5 mb-4 sm:mb-5 overflow-hidden">
                <span className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-display font-medium text-[#CDFF00] tabular-nums tracking-tight leading-none">
                  {formatMln(netProfit)}
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-display text-[#CDFF00]/55 font-light">₽</span>
              </div>

              {/* Three sub-metrics */}
              <div className="grid grid-cols-3 border border-[#EFECE6]/6">
                {/* ROI */}
                <div className="px-3 sm:px-4 py-3 sm:py-4 border-r border-[#EFECE6]/6">
                  <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-[#EFECE6]/35 mb-1.5">ROI</p>
                  <p className="text-base sm:text-xl md:text-2xl font-display text-[#EFECE6] tabular-nums">+{roi}%</p>
                  <p className="text-[9px] text-[#EFECE6]/25 font-mono mt-1 uppercase tracking-widest hidden sm:block">от вложений</p>
                </div>
                {/* Per hectare */}
                <div className="px-3 sm:px-4 py-3 sm:py-4 border-r border-[#EFECE6]/6">
                  <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-[#EFECE6]/35 mb-1.5">₽ / га</p>
                  <p className="text-base sm:text-xl md:text-2xl font-display text-[#EFECE6] tabular-nums">
                    {savedPerHa >= 1000
                      ? (savedPerHa / 1000).toFixed(1) + "К"
                      : Math.round(savedPerHa).toLocaleString("ru-RU")}
                  </p>
                  <p className="text-[9px] text-[#EFECE6]/25 font-mono mt-1 uppercase tracking-widest hidden sm:block">с гектара</p>
                </div>
                {/* Costs */}
                <div className="px-3 sm:px-4 py-3 sm:py-4">
                  <p className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-[#EFECE6]/35 mb-1.5">Затраты</p>
                  <p className="text-base sm:text-xl md:text-2xl font-display text-[#EFECE6]/65 tabular-nums">
                    {(totalCost / 1_000_000).toFixed(2)}М
                  </p>
                  <p className="text-[9px] text-[#EFECE6]/25 font-mono mt-1 uppercase tracking-widest hidden sm:block">рублей</p>
                </div>
              </div>
            </div>

            {/* Ambient bottom glow */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#CDFF00]/[0.04] to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
