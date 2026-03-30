"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const LOSS_PERCENTAGE = 15;
const COST_PER_HA = 1500;

const AREA_RANGE = { min: 100, max: 10000, step: 100 };
const YIELD_RANGE = { min: 10, max: 60, step: 1 };
const PRICE_RANGE = { min: 20000, max: 80000, step: 1000 };
const METRIC_LABEL_ALIASES: Record<string, string> = {
  "Площадь посева (га)": "Площадь",
  "Урожайность (ц/га)": "Урожайность",
  "Цена рапса (руб/тн)": "Цена рапса",
};
const AUTO_SCENARIOS = [
  { area: 1000, yieldPerHa: 25, price: 45000 },
  { area: 1400, yieldPerHa: 31, price: 52000 },
  { area: 2200, yieldPerHa: 38, price: 61000 },
];
const CALCULATOR_STAGES = [
  {
    id: "risk",
    pill: "Диагностика потерь",
    title: ["Каждый день перестоя", "дороже, чем кажется."],
    accentLineIndex: undefined,
    description:
      "Без защиты под ударом последние 15% урожая. Именно там, где рвётся маржа и рассыпается результат всего сезона.",
  },
  {
    id: "membrane",
    pill: "Мембрана активна",
    title: ["ГРИПИЛ не считает потери.", "Он их перехватывает."],
    accentLineIndex: 1,
    description:
      "Мембрана проходит по полю как защитный фронт: фиксирует шов стручка и возвращает тебе время до уборки.",
  },
  {
    id: "roi",
    pill: "Финальная окупаемость",
    title: ["В сухом остатке остаётся", "не риск, а капитал."],
    accentLineIndex: 1,
    description:
      "Стоимость защиты остаётся небольшой строкой. Главным числом становится чистая выгода на гектар и на всё поле.",
  },
] as const;
const NOOP_CHANGE = () => undefined;
const SHOWCASE_SCENARIO_INDEX = 1;
const SHOWCASE_STAGE_INDEX = 2;
const STAGE_HOLD_MS = 9000;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function calculateScenario(area: number, yieldPerHa: number, price: number) {
  const totalYieldTon = (area * yieldPerHa) / 10;
  const lossTon = totalYieldTon * (LOSS_PERCENTAGE / 100);
  const savedMoney = lossTon * price;
  const totalCost = area * COST_PER_HA;
  const netProfit = Math.max(0, savedMoney - totalCost);
  const roi = totalCost === 0 ? 0 : (netProfit / totalCost) * 100;
  const savedPerHa = area === 0 ? 0 : netProfit / area;

  return {
    totalYieldTon,
    lossTon,
    savedMoney,
    totalCost,
    netProfit,
    roi,
    savedPerHa,
  };
}

const MAX_SCENARIO = calculateScenario(AREA_RANGE.max, YIELD_RANGE.max, PRICE_RANGE.max);

function formatMln(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} МЛН`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)} ТЫС`;
  return Math.round(value).toLocaleString("ru-RU");
}

function formatPerHa(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}К`;
  return Math.round(value).toLocaleString("ru-RU");
}

function formatMillionsShort(value: number): string {
  return `${(value / 1_000_000).toFixed(2)}М`;
}

function formatTons(value: number): string {
  return `${value.toFixed(0)} т`;
}

function splitMetricLabel(label: string) {
  const match = label.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
  return {
    title: match?.[1]?.trim() ?? label,
    unit: match?.[2]?.trim().toUpperCase() ?? "",
  };
}

function splitDisplayValue(displayValue: string) {
  const match = displayValue.match(/^(.*?)(?:\s+([^\s]+))$/);

  if (!match) {
    return { value: displayValue, unit: "" };
  }

  return {
    value: match[1],
    unit: match[2],
  };
}

function AnimatedNumber({
  value,
  formatFn,
  className = "",
}: {
  value: number;
  formatFn?: (value: number) => string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(formatFn ? formatFn(value) : String(Math.round(value)));
  const previousValueRef = useRef(value);

  useEffect(() => {
    const fromValue = previousValueRef.current;
    const controls = animate(fromValue, value, {
      duration: 2.4,
      ease: "easeInOut",
      onUpdate: (latest) => {
        setDisplayValue(formatFn ? formatFn(latest) : String(Math.round(latest)));
      },
    });

    previousValueRef.current = value;

    return () => controls.stop();
  }, [formatFn, value]);

  return <span className={className}>{displayValue}</span>;
}

function MetricRail({
  label,
  value,
  displayValue,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  onChange,
  interactive = false,
  active = false,
}: {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
  interactive?: boolean;
  active?: boolean;
}) {
  const ratio = clamp((value - min) / (max - min));
  const { title, unit } = splitMetricLabel(label);
  const displayTitle = METRIC_LABEL_ALIASES[label] ?? title;
  const { value: displayMain, unit: displayUnit } = splitDisplayValue(displayValue);
  const railCardClass = active
    ? "border-[#B6D54A]/16 bg-[linear-gradient(180deg,rgba(16,28,15,0.94),rgba(10,20,12,0.9))] shadow-[0_18px_40px_rgba(122,148,42,0.12)]"
    : "border-[#EFECE6]/8 bg-[linear-gradient(180deg,rgba(11,22,14,0.92),rgba(9,19,12,0.88))] shadow-[0_16px_34px_rgba(0,0,0,0.22)]";
  const railTitleClass = active ? "text-[#EFECE6]/52" : "text-[#EFECE6]/34";
  const railUnitClass = active
    ? "border-[#B6D54A]/22 bg-[#B6D54A]/10 text-[#D8E9A2]/82"
    : "border-[#B6D54A]/16 bg-[#B6D54A]/6 text-[#C6D98A]/72";
  const liveClass = active ? "text-[#C6D98A]/52" : "text-[#EFECE6]/26";

  return (
    <div className={`group relative overflow-hidden rounded-[22px] border px-4 py-3.5 transition-all duration-500 ${railCardClass}`}>
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6D54A]/38 to-transparent transition-opacity duration-500 ${active ? "opacity-100" : "opacity-65"}`} />
      <div className={`pointer-events-none absolute right-[-10%] top-[-25%] h-24 w-24 rounded-full bg-[#B6D54A]/[0.05] blur-3xl transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
      <div className="flex items-start justify-between gap-4">
        <div className={`font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-500 ${railTitleClass}`}>{displayTitle}</div>
        {(displayUnit || unit) ? (
          <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] transition-all duration-500 ${railUnitClass}`}>
            {displayUnit || unit}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="font-display text-[2.05rem] leading-none tracking-[-0.03em] text-[#EFECE6] sm:text-[2.35rem]">
          {displayMain}
        </div>
        <div className={`font-mono text-[10px] uppercase tracking-[0.22em] transition-colors duration-500 ${liveClass}`}>
          сейчас
        </div>
      </div>

      <div className="relative mt-3 h-9">
        <div className="absolute inset-x-0 top-1/2 h-[10px] -translate-y-1/2 rounded-full bg-[#EFECE6]/7" />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-1">
          {Array.from({ length: 7 }, (_, index) => (
            <span key={index} className="h-3 w-px bg-[#EFECE6]/16" />
          ))}
        </div>
        <div
          className="absolute left-0 top-1/2 h-[10px] rounded-full bg-[linear-gradient(90deg,#B6D54A_0%,rgba(182,213,74,0.38)_100%)] shadow-[0_0_16px_rgba(182,213,74,0.16)]"
          style={{
            width: `${ratio * 100}%`,
            transform: "translateY(-50%)",
          }}
        />
        <div
          className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#EEF3D0] bg-[#B6D54A] shadow-[0_0_18px_rgba(182,213,74,0.28)]"
          style={{ left: `${ratio * 100}%` }}
        />
        {interactive ? (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
        ) : null}
      </div>

      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[#EFECE6]/28">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  accent = "default",
  helper,
  active = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "default" | "warning";
  helper: string;
  active?: boolean;
}) {
  const toneClass =
    accent === "warning"
      ? "border-[#FF7B57]/14 bg-[#170F0C]/74"
      : "border-[#EFECE6]/8 bg-[#0B150E]/76";
  const activeClass =
    active
      ? accent === "warning"
        ? "shadow-[0_18px_34px_rgba(113,49,31,0.24)] border-[#FF7B57]/22"
        : "shadow-[0_18px_34px_rgba(122,148,42,0.12)] border-[#B6D54A]/14"
      : "shadow-none";

  return (
    <div className={`rounded-[22px] border px-4 py-3.5 transition-all duration-500 ${toneClass} ${activeClass}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#EFECE6]/40">{label}</div>
      <div className="mt-2.5 flex items-end gap-2">
        <div className="font-display text-[1.95rem] leading-none tracking-tight text-[#EFECE6] sm:text-[2.2rem]">
          {value}
        </div>
      </div>
      <p className="mt-1.5 text-[11px] leading-5 text-[#EFECE6]/44">{helper}</p>
    </div>
  );
}

function InlineMetric({
  label,
  value,
  tone = "default",
  active = false,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "warning" | "success";
  active?: boolean;
}) {
  const toneClass =
    tone === "warning" ? "text-[#F3C1B0]" : tone === "success" ? "text-[#B6D54A]" : "text-[#EFECE6]";
  const activeClass = active
    ? tone === "warning"
      ? "border-[#FF7B57]/20 bg-[#16100D]/82 shadow-[0_16px_30px_rgba(113,49,31,0.18)]"
      : tone === "success"
        ? "border-[#B6D54A]/18 bg-[#10180D]/82 shadow-[0_16px_30px_rgba(122,148,42,0.12)]"
        : "border-[#B6D54A]/14 bg-[#10170D]/78 shadow-[0_16px_28px_rgba(0,0,0,0.18)]"
    : "border-[#EFECE6]/8 bg-[#0D150D]/62";

  return (
    <div className={`rounded-[16px] border px-3 py-2.5 transition-all duration-500 ${activeClass}`}>
      <div suppressHydrationWarning className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#EFECE6]/32">
        {label}
      </div>
      <div suppressHydrationWarning className={`mt-1.5 font-display text-[1.5rem] leading-none tracking-tight ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

export default function YieldCalculator() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [stageIndex, setStageIndex] = useState(0);
  const sceneMotion = useMotionValue(0);
  const activeStageIndex = prefersReducedMotion ? SHOWCASE_STAGE_INDEX : stageIndex;
  const activeStage = CALCULATOR_STAGES[activeStageIndex];
  const { area, yieldPerHa, price } = AUTO_SCENARIOS[SHOWCASE_SCENARIO_INDEX];

  const scenario = calculateScenario(area, yieldPerHa, price);
  const impactRatio = clamp(scenario.netProfit / MAX_SCENARIO.netProfit);

  const smoothStage = useSpring(sceneMotion, {
    stiffness: 48,
    damping: 18,
    mass: 1.1,
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setStageIndex((currentStage) => (currentStage + 1) % CALCULATOR_STAGES.length);
    }, STAGE_HOLD_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [prefersReducedMotion, sceneMotion]);

  useEffect(() => {
    sceneMotion.set(activeStageIndex);
  }, [activeStageIndex, sceneMotion]);

  const panelY = useTransform(smoothStage, [0, 1, 2], [4, 1, 0]);
  const isRiskStage = activeStage.id === "risk";
  const isMembraneStage = activeStage.id === "membrane";
  const isRoiStage = activeStage.id === "roi";
  const ctaCaseLabel = `${area.toLocaleString("ru-RU")} га / ${yieldPerHa} ц/га / ${price.toLocaleString("ru-RU")} ₽`;

  return (
    <section
      id="calc-section"
      ref={sectionRef}
      className="relative min-h-[100svh] overflow-clip bg-[#071109] font-sans text-[#EFECE6]"
    >
      <div className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/shattered.webp"
            alt="Почва и семена рапса"
            fill
            priority={false}
            quality={80}
            sizes="100vw"
            className="object-cover object-center opacity-56"
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(7,17,9,0.96)_0%,rgba(7,17,9,0.82)_38%,rgba(7,17,9,0.72)_60%,rgba(7,17,9,0.9)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_38%,rgba(255,123,87,0.07),transparent_28%),radial-gradient(circle_at_74%_44%,rgba(182,213,74,0.05),transparent_24%),radial-gradient(circle_at_52%_82%,rgba(239,236,230,0.04),transparent_28%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:90px_90px] opacity-[0.08]" />
        </div>

        <div className="relative z-10 mx-auto grid h-full max-w-[1540px] grid-cols-1 gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.88fr)] lg:gap-8 lg:px-10 lg:py-8 xl:px-14 max-lg:overflow-y-auto">
          <div className="flex min-h-0 flex-col lg:overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-[#B6D54A]/48" />
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6D98A]/68">
                Риск → Капитал
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {CALCULATOR_STAGES.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  animate={{
                    opacity: activeStageIndex === index ? 1 : 0.42,
                    borderColor: activeStageIndex === index ? "rgba(198,217,138,0.18)" : "rgba(239,236,230,0.1)",
                    backgroundColor: activeStageIndex === index ? "rgba(182,213,74,0.08)" : "rgba(239,236,230,0.05)",
                  }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="rounded-full border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#EFECE6]/60"
                >
                  {stage.pill}
                </motion.div>
              ))}
            </div>
            <div className="relative mt-6 min-h-[248px] max-w-[46rem] sm:min-h-[272px] lg:min-h-[236px] xl:min-h-[264px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeStage.id}
                  initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, filter: "blur(10px)" }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <h2 className="max-w-[14ch] font-display text-[clamp(3.15rem,7vw,4.9rem)] font-medium leading-[0.92] tracking-[-0.045em] text-[#EFECE6]">
                    {activeStage.title.map((line, lineIndex) => (
                      <span key={`${activeStage.id}-${lineIndex}`} className="block">
                        {activeStage.accentLineIndex === lineIndex ? (
                          <span className="font-light italic text-[#C6D98A]">{line}</span>
                        ) : (
                          line
                        )}
                      </span>
                    ))}
                  </h2>
                  <p className="mt-4 max-w-[34rem] text-[15px] leading-relaxed text-[#EFECE6]/64 sm:text-[17px]">
                    {activeStage.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <motion.div style={{ y: panelY }} className="min-h-0 lg:py-3">
            <div className="relative flex h-full min-h-[640px] flex-col overflow-hidden rounded-[30px] border border-[#EFECE6]/10 bg-[#09120B]/92 shadow-[0_32px_84px_rgba(0,0,0,0.3)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B6D54A]/48 to-transparent" />
              <div
                className="pointer-events-none absolute right-[-18%] top-[22%] h-56 w-56 rounded-full bg-[#B6D54A]/[0.05] blur-[64px]"
                style={{ opacity: 0.2 + impactRatio * 0.28 }}
              />

              <div className="flex items-center justify-between border-b border-[#EFECE6]/6 px-5 py-3.5 sm:px-6">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6D98A]/68">Панель окупаемости</div>
                  <div className="mt-1 text-[13px] leading-5 text-[#EFECE6]/55">
                    Один показательный сценарий. Левая сцена показывает путь от риска к капиталу, правая фиксирует экономику сезона.
                  </div>
                </div>
                <div className="rounded-full border border-[#EFECE6]/10 bg-[#EFECE6]/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#EFECE6]/48">
                  Сценарий сезона
                </div>
              </div>

            <div className="relative z-10 flex flex-1 flex-col gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5">
                <div className="grid gap-2.5 xl:grid-cols-3">
                  <MetricRail
                    label="Площадь посева (га)"
                    value={area}
                    displayValue={`${area.toLocaleString("ru-RU")} ГА`}
                    min={AREA_RANGE.min}
                    max={AREA_RANGE.max}
                    step={AREA_RANGE.step}
                    minLabel="100"
                    maxLabel="10 000"
                    onChange={NOOP_CHANGE}
                    active={isMembraneStage}
                  />

                  <MetricRail
                    label="Урожайность (ц/га)"
                    value={yieldPerHa}
                    displayValue={`${yieldPerHa} Ц/ГА`}
                    min={YIELD_RANGE.min}
                    max={YIELD_RANGE.max}
                    step={YIELD_RANGE.step}
                    minLabel="10"
                    maxLabel="60"
                    onChange={NOOP_CHANGE}
                    active={isMembraneStage}
                  />

                  <MetricRail
                    label="Цена рапса (руб/тн)"
                    value={price}
                    displayValue={`${price.toLocaleString("ru-RU")} ₽`}
                    min={PRICE_RANGE.min}
                    max={PRICE_RANGE.max}
                    step={PRICE_RANGE.step}
                    minLabel="20К"
                    maxLabel="80К"
                    onChange={NOOP_CHANGE}
                    active={isMembraneStage}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <SummaryTile
                    label="Потенциал потерь без защиты"
                    accent="warning"
                    helper="Риск сезона без мембраны."
                    active={isRiskStage}
                    value={
                      <div className="flex items-end gap-2">
                        <AnimatedNumber
                          value={scenario.savedMoney}
                          formatFn={formatMln}
                          className="font-display text-[1.95rem] leading-none tracking-tight text-[#F3D0C6] sm:text-[2.2rem]"
                        />
                        <span className="pb-0.5 text-base text-[#F3D0C6]/55">₽</span>
                      </div>
                    }
                  />
                  <SummaryTile
                    label="Инвестиция в обработку"
                    helper="Полная стоимость обработки."
                    active={isMembraneStage}
                    value={
                      <div className="flex items-end gap-2">
                        <AnimatedNumber
                          value={scenario.totalCost}
                          formatFn={formatMillionsShort}
                          className="font-display text-[1.95rem] leading-none tracking-tight text-[#EFECE6] sm:text-[2.2rem]"
                        />
                        <span className="pb-0.5 text-base text-[#EFECE6]/45">₽</span>
                      </div>
                    }
                  />
                </div>

                <div className={`relative overflow-hidden rounded-[24px] border px-4 py-3 transition-all duration-500 ${isRoiStage ? "border-[#B6D54A]/18 bg-[#10180E]/92 shadow-[0_24px_56px_rgba(122,148,42,0.12)]" : "border-[#B6D54A]/10 bg-[#0D160D]/88"}`}>
                  <div className="absolute inset-y-0 right-0 w-[34%] bg-[radial-gradient(circle_at_35%_50%,rgba(182,213,74,0.12),transparent_62%)]" />
                  <div className="relative z-10">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C6D98A]/68">
                      Чистая выгода от ГРИПИЛ
                    </div>
                    <div className="mt-2.5 flex items-end gap-2 overflow-hidden">
                      <AnimatedNumber
                        value={scenario.netProfit}
                        formatFn={formatMln}
                        className="font-display text-[2.45rem] leading-none tracking-[-0.04em] text-[#C6D98A] sm:text-[3rem]"
                      />
                      <span className="pb-1 text-base text-[#C6D98A]/54 sm:text-lg">₽</span>
                    </div>
                    <p className="mt-1 max-w-md text-[12px] leading-[1.1rem] text-[#EFECE6]/54">
                      Экономика сезона после прохода защитной мембраны.
                    </p>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <InlineMetric
                        label="Окупаемость"
                        value={<AnimatedNumber value={scenario.roi} formatFn={(value) => `+${Math.round(value)}%`} />}
                        tone="success"
                        active={isRoiStage}
                      />
                      <InlineMetric
                        label="₽ / га"
                        value={<AnimatedNumber value={scenario.savedPerHa} formatFn={formatPerHa} />}
                      />
                      <InlineMetric label="Под риском" value={`${LOSS_PERCENTAGE}%`} tone="warning" active={isRiskStage} />
                      <InlineMetric
                        label="Спасённый объём"
                        value={<AnimatedNumber value={scenario.lossTon} formatFn={formatTons} />}
                        active={isMembraneStage}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" })}
                  className={`group relative mt-auto w-full overflow-hidden rounded-[26px] border px-6 py-4 text-left transition-all duration-500 sm:px-7 sm:py-[1.125rem] ${isRoiStage ? "border-[#B6D54A]/32 bg-[linear-gradient(135deg,rgba(182,213,74,0.2)_0%,rgba(28,46,18,0.98)_30%,rgba(14,23,13,0.98)_100%)] shadow-[0_30px_72px_rgba(122,148,42,0.2)]" : "border-[#B6D54A]/20 bg-[linear-gradient(135deg,rgba(182,213,74,0.14)_0%,rgba(22,36,15,0.96)_32%,rgba(14,23,13,0.98)_100%)] shadow-[0_24px_52px_rgba(122,148,42,0.12)]"} hover:border-[#B6D54A]/34 hover:shadow-[0_32px_76px_rgba(122,148,42,0.18)]`}
                >
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-[38%] bg-[radial-gradient(circle_at_20%_50%,rgba(182,213,74,0.24),transparent_72%)] opacity-76 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_0%,transparent_35%)] opacity-40" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#E8F3BA]/48 to-transparent" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6D98A]/76">
                        Выгода уже посчитана
                      </div>
                      <div className="mt-2 font-display text-[1.55rem] leading-[0.92] tracking-[-0.04em] text-[#F4FFD6] sm:text-[1.9rem]">
                        Получить техкарту и снимок окупаемости по сценарию
                      </div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C6D98A]/74 sm:text-[11px]">
                        {ctaCaseLabel}
                      </div>
                    </div>
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#B6D54A]/28 bg-[#B6D54A]/12 text-[#E8F3BA] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                      <ArrowUpRight className="h-6 w-6" />
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}






