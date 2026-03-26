"use client";

import { motion } from "framer-motion";

export default function TimingSection() {
  const steps = [
    {
      title: "BBCH 79-80",
      subtitle: "Идеально",
      desc: "Желто-зеленый стручок эластичен. Семена еще зеленые. Влажность 30-40%. Био-корсет фиксирует стенки до начала ссыхания.",
      active: true,
    },
    {
      title: "BBCH 85-89",
      subtitle: "Слишком поздно",
      desc: "Стручки бежевые или коричневые, хрупкие. При малейшем касании штангой опрыскивателя они трескаются. Потери от прохода техники до 10%.",
      active: false,
    }
  ];

  return (
    <section className="py-20 md:py-32 lg:pt-48 lg:pb-64 bg-[#EFECE6] text-[#112118] relative font-sans border-t border-[#112118]/5 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16 relative z-10 flex flex-col md:flex-row gap-16 xl:gap-24 items-start">
        
        {/* Editorial Header */}
        <div className="w-full md:w-5/12">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "3rem" }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
            className="h-[1px] bg-[#112118]/30 mb-8"
          />
          <motion.h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-medium tracking-tight leading-[1.05] mb-8 text-[#112118]">
            Успейте за <br/><span className="italic font-normal text-[#112118]/90">3 недели</span><br/> до уборки
          </motion.h2>
          <motion.p className="text-xl text-[#112118]/80 font-normal leading-relaxed max-w-sm">
            Пленка наносится на еще зеленый, упругий стручок. Заедете опрыскивать сухое поле — выбьете урожай штангами.
          </motion.p>
        </div>

        {/* Timeline Grid */}
        <div className="w-full md:w-7/12 mt-12 md:mt-0">
          <div className="border-l border-[#112118]/20 pl-8 space-y-20 relative">
            
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1, delay: idx * 0.2, ease: [0.16, 1, 0.3, 1] as any }}
                className="relative"
              >
                {/* Dot marker */}
                <div className={`absolute -left-[41px] top-6 md:top-1/2 md:-translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#EFECE6] shadow-sm flex items-center justify-center ${
                  step.active ? "bg-[#112118]" : "bg-[#112118]/20"
                }`}>
                  {step.active && <div className="w-1.5 h-1.5 bg-[#CDFF00] rounded-full animate-pulse" />}
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="w-full sm:w-1/3">
                    <h3 className={`text-4xl font-display font-light mb-2 ${step.active ? "text-[#112118]" : "text-[#112118]/50"}`}>
                      {step.title}
                    </h3>
                    <div className="inline-block px-3 py-1 border border-[#112118]/10 rounded-full text-[10px] uppercase font-mono tracking-widest text-[#112118]/60">
                      {step.subtitle}
                    </div>
                  </div>
                  <div className="w-full sm:w-2/3">
                    <p className={`text-lg font-normal leading-relaxed ${step.active ? "text-[#112118]/90" : "text-[#112118]/50"}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            
          </div>
        </div>

      </div>
    </section>
  );
}
