"use client";

import { motion } from "framer-motion";
import { Shield, Sparkles, Droplets, Wind } from "lucide-react";
import { EMPHATIC_EASE } from "@/lib/motion";

export default function HowItWorksSection() {
  const steps = [
    {
      icon: <Droplets className="w-8 h-8 text-[#112118]" />,
      title: "Полимеризация",
      desc: "При распылении образуется эластичная нано-полимерная сетка, обволакивающая стручок."
    },
    {
      icon: <Wind className="w-8 h-8 text-[#112118]" />,
      title: "Дыхание стручка",
      desc: "Сетка водонепроницаема снаружи, но свободно пропускает влагу изнутри. Семена дозревают естественно."
    },
    {
      icon: <Shield className="w-8 h-8 text-[#112118]" />,
      title: "Био-корсет",
      desc: "Корсет увеличивает физическую прочность стручка на разрыв до 4-х раз. Ветер больше не страшен."
    },
    {
      icon: <Sparkles className="w-8 h-8 text-[#112118]" />,
      title: "Разлагаемость",
      desc: "Спустя 4 недели под воздействием УФ-лучей пленка уничтожается, не загрязняя почву микропластиком."
    }
  ];

  return (
    <section className="py-10 md:py-14 lg:py-20 bg-[#EFECE6] text-[#112118] relative overflow-hidden font-sans border-t border-[#112118]/5">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 relative z-10 flex flex-col xl:flex-row gap-16 items-start">
        
        {/* Editorial Text */}
        <div className="flex-1 w-full lg:sticky top-32 flex flex-col h-full justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              whileInView={{ opacity: 1, width: "3rem" }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: EMPHATIC_EASE }}
              className="h-[1px] bg-[#112118]/30 mb-8"
            />

            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: EMPHATIC_EASE, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-medium tracking-tight leading-[1.05] mb-8 text-[#112118]"
            >
              Мембрана,<br />которая <span className="italic font-normal text-[#112118]/90">дышит</span>
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: EMPHATIC_EASE, delay: 0.2 }}
              className="text-xl text-[#112118]/80 font-normal leading-relaxed max-w-md mb-12"
            >
              Забудьте о токсичном клее. ГРИПИЛ — это умная полупроницаемая нано-структура на базе натуральных хвойных смол.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-16 xl:mt-32 p-6 md:p-8 border border-[#d8d4cc] rounded-sm bg-[#EFECE6]/50 shadow-[0_2px_16px_rgba(0,0,0,0.06)] max-w-md"
          >
            <p className="text-[#112118]/90 font-serif italic font-light text-lg leading-relaxed mb-6">
              &ldquo;В отличие от десикантов, мембрана не убивает растение, а позволяет семенам в верхних ярусах дозреть, достигнув максимальной масличности.&rdquo;
            </p>
            <div className="flex items-center gap-4">
              <div className="w-4 h-[2px] bg-[#2a7a4a]" />
              <span className="uppercase tracking-widest text-[#112118]/70 text-[10px] sm:text-xs font-mono font-bold">Агро-лаборатория СибГАУ, 2024</span>
            </div>
          </motion.div>
        </div>

        {/* Minimalist Grid */}
        <div className="flex-[1.2] w-full grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12 xl:pl-12">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.1, duration: 1, ease: EMPHATIC_EASE }}
              className="group"
            >
              <div className="w-16 h-16 rounded-full border border-[#112118]/10 flex items-center justify-center mb-8 relative overflow-hidden group-hover:border-[#112118]/30 transition-colors">
                <div className="absolute inset-0 bg-[#112118]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-3xl font-display font-light mb-4 text-[#112118]">{step.title}</h3>
              <p className="text-[#112118]/80 font-normal leading-relaxed text-base">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
