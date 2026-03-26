"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ProblemSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-32 md:py-48 bg-[#EFECE6] text-[#112118] px-6 lg:px-16 overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
        
        {/* Левая колонка - Заголовок и стейтмент */}
        <div className="lg:col-span-5 flex flex-col justify-start pt-8">
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: "3rem" }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="h-[1px] bg-[#112118]/30 mb-8"
          />
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl font-display font-medium tracking-tight leading-[1.05]"
          >
            Потери начинаются<br/>
            до комбайна
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mt-8 text-base text-[#112118]/60 font-sans font-normal leading-relaxed max-w-md"
          >
            Генетика гибридов не способна полностью защитить стручок от механического воздействия в последние недели созревания. Ветер, температурные перепады и проход техники безвозвратно выбивают центнеры на землю.
          </motion.p>
        </div>

        {/* Правая колонка - Editorial Data Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="lg:col-span-6 lg:col-start-7 flex flex-col gap-12"
        >
          {/* Item 1 */}
          <motion.div variants={item} className="relative pl-6 md:pl-12 border-l border-[#112118]/10">
            <h3 className="text-[#555555] font-mono font-medium text-sm uppercase tracking-widest mb-4">Фаза созревания</h3>
            <div className="text-5xl md:text-6xl lg:text-[4rem] font-display font-light text-[#112118] mb-4">Растрескивание</div>
            <p className="text-[#112118]/70 text-base font-normal leading-relaxed">
              Верхние ярусы созревают быстрее, высыхают и лопаются под солнцем, пока нижние ярусы еще зеленые.
            </p>
          </motion.div>

          {/* Item 2 */}
          <motion.div variants={item} className="relative pl-6 md:pl-12 border-l border-[#112118]/10">
            <h3 className="text-[#555555] font-mono font-medium text-sm uppercase tracking-widest mb-4">Погодный риск</h3>
            <div className="text-5xl md:text-6xl lg:text-[4rem] font-display font-light text-[#112118] mb-4">Осыпание</div>
            <p className="text-[#112118]/70 text-base font-normal leading-relaxed">
              Шквальный ветер и дожди превращают стручок в хрупкую капсулу. Любой удар приводит к тотальному раскрытию шва.
            </p>
          </motion.div>

          {/* Item 3 */}
          <motion.div variants={item} className="relative pl-6 md:pl-12 border-l border-[#112118]/10">
            <h3 className="text-[#555555] font-mono font-medium text-sm uppercase tracking-widest mb-4">Логистика</h3>
            <div className="text-5xl md:text-6xl lg:text-[4rem] font-display font-light text-[#112118] mb-4">Узкое окно</div>
            <p className="text-[#112118]/70 text-base font-normal leading-relaxed">
              Не успели убрать вовремя? Каждый день перестоя поля стоит хозяйству до 1-2% от общего потенциала урожая.
            </p>
          </motion.div>
        </motion.div>

      </div>
      
      {/* Декоративный элемент параллакса */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute -right-32 top-10 text-[15rem] font-display font-bold text-[#112118]/[0.04] select-none pointer-events-none"
      >
        LOSSES
      </motion.div>

      <motion.div 
        style={{ y: y2 }}
        className="absolute -left-32 bottom-20 text-[10rem] font-display font-bold text-[#112118]/[0.04] select-none pointer-events-none"
      >
        URGENCY
      </motion.div>
    </section>
  );
}
