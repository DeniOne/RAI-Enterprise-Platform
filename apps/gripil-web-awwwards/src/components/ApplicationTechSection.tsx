"use client";

import { motion } from "framer-motion";
import { Plane, Tractor, Droplet } from "lucide-react";
import { EMPHATIC_EASE } from "@/lib/motion";

export default function ApplicationTechSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EMPHATIC_EASE } },
  };

  return (
    <section id="application-tech" className="py-14 md:py-20 lg:py-24 bg-[#EFECE6] text-[#112118] px-5 sm:px-8 lg:px-16 border-t border-[#112118]/10 overflow-hidden font-sans">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
        
        {/* Левая колонка - Заголовок и стейтмент */}
        <div className="lg:col-span-5 flex flex-col justify-start">
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
            transition={{ duration: 1, ease: EMPHATIC_EASE }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-display font-medium tracking-tight leading-[1.05] mb-6"
          >
            Внесение без<br/>
            <span className="italic font-light text-[#112118]/40">лишней сложности</span>
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-6 text-[#112118]/70 text-base lg:text-lg max-w-md font-light leading-relaxed"
          >
            <p>
              ГРИПИЛ — это не лишняя операция. Это понятный технологический шаг, который помогает сохранить центнеры до уборки. Ключевое условие эффективности — <strong className="font-medium text-[#112118]">равномерное мелкокапельное смачивание растений</strong>.
            </p>
            <p className="text-sm font-mono uppercase tracking-widest text-[#112118]/40">
              Оптимальное окно: за 3–4 недели до уборки (начало посветления зелёного стручка).
            </p>
          </motion.div>
        </div>

        {/* Правая колонка - Технические параметры */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="lg:col-span-6 lg:col-start-7 flex flex-col justify-center"
        >
          {/* Главный Норматив */}
          <motion.div variants={itemVariants} className="mb-10 bg-[#112118] text-[#EFECE6] p-6 lg:p-8 rounded-[2px] shadow-xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#CDFF00]/10 rounded-full blur-3xl group-hover:bg-[#CDFF00]/20 transition-all duration-700" />
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#EFECE6]/40 mb-3">Базовая норма</div>
            <div className="text-4xl lg:text-5xl font-display font-medium text-[#CDFF00] mb-2 tracking-tight">1,0 <span className="text-xl lg:text-2xl text-[#CDFF00]/50 font-light">л/га</span></div>
            <div className="text-[#EFECE6]/60 text-sm">Расход препарата ГРИПИЛ независимо от способа внесения</div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 mb-10">
            {/* Наземное */}
            <motion.div variants={itemVariants} className="border-l border-[#112118]/10 pl-5">
              <div className="flex items-center gap-3 mb-3">
                <Tractor className="w-5 h-5 text-[#2D6A4F]" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#112118]">Наземные</h3>
              </div>
              <div className="text-2xl font-display font-medium text-[#112118] mb-1">200–300 <span className="text-lg font-light text-[#112118]/40">л/га</span></div>
              <p className="text-[#112118]/50 text-xs uppercase tracking-widest font-mono mt-2">Рабочей жидкости</p>
            </motion.div>

            {/* Авиация */}
            <motion.div variants={itemVariants} className="border-l border-[#112118]/10 pl-5">
              <div className="flex items-center gap-3 mb-3">
                <Plane className="w-5 h-5 text-[#2D6A4F]" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#112118]">Авиация / Дроны</h3>
              </div>
              <div className="text-2xl font-display font-medium text-[#112118] mb-1">4–100 <span className="text-lg font-light text-[#112118]/40">л/га</span></div>
              <p className="text-[#112118]/50 text-xs uppercase tracking-widest font-mono mt-2">Малообъемное внесение</p>
            </motion.div>
          </div>

          {/* Баковые смеси */}
          <motion.div variants={itemVariants} className="pt-6 border-t border-[#112118]/10 flex gap-4">
            <Droplet className="w-6 h-6 text-[#112118] shrink-0 mt-1" />
            <div>
              <h4 className="text-base font-display font-medium mb-2">Баковые смеси</h4>
              <ul className="space-y-2 text-sm text-[#112118]/70 font-light list-disc list-inside">
                <li>Обязательная предварительная проверка совместимости</li>
                <li>Контроль стабильности раствора в баке</li>
                <li>Сохранение качества покрытия листьев и стручков</li>
              </ul>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
