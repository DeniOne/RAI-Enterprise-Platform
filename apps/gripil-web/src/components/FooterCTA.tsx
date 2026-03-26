"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function FooterCTA() {
  return (
    <footer id="cta-section" className="relative bg-[#0A140E] text-[#EFECE6] overflow-hidden border-t border-[#EFECE6]/10 font-sans">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16 pt-10 pb-8 md:pt-14 md:pb-10 lg:pt-20 relative z-10 flex flex-col md:flex-row justify-between items-end gap-10 md:gap-16">
        
        {/* Editorial Text Block */}
        <div className="flex-1 text-left w-full md:w-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-medium tracking-tight leading-[0.9] text-[#EFECE6] mb-8 md:mb-12"
          >
            Хватит<br/>оставлять<br/>
            <span className="italic font-light text-[#EFECE6]/[0.65]">миллионы</span><br/>
            в поле.
          </motion.h2>

          {/* Line separator */}
          <div className="w-full h-[1px] bg-[#EFECE6]/10 mb-12" />

          {/* Form / Quick Action */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] as any }}
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-6"
          >
            <div className="w-full sm:w-80">
              <label className="block text-[13px] font-mono tracking-[0.12em] uppercase text-[#EFECE6]/60 mb-3">Технологическая карта (Бесплатно)</label>
              <div className="bg-[#1A261E]/50 p-6 md:p-8 rounded-sm backdrop-blur-sm border border-[#EFECE6]/5 relative group">
              
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    alert('Спасибо! Ваш расчет отправлен на обработку. Мы свяжемся с вами в течение 15 минут.');
                  }}
                  className="flex flex-col sm:flex-row gap-3 relative z-10"
                >
                  <input 
                    type="tel" 
                    placeholder="+7 (___) ___-__-__" 
                    required
                    className="w-full px-4 py-3 bg-[#112118] border border-white/30 rounded focus:outline-none focus:border-[#CDFF00] text-lg font-light text-[#EFECE6] placeholder:text-[#EFECE6]/40 transition-colors"
                  />
              
                  <button className="flex items-center justify-center gap-2 px-8 py-3 h-[52px] bg-[#CDFF00] text-[#112118] font-medium uppercase tracking-widest text-sm rounded-sm hover:bg-[#DFFF33] transition-colors w-full sm:w-auto mt-2 sm:mt-0">
                    Отправить
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Contact/Proof Zone */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
          className="hidden md:flex flex-col items-end text-right pb-4"
        >
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#EFECE6]/40 mb-4">На связи напрямую</div>
          <div className="flex gap-4 mb-6">
            <div className="w-12 h-12 rounded-sm border border-[#EFECE6]/20 flex items-center justify-center text-[#EFECE6] hover:bg-[#EFECE6]/10 hover:border-[#EFECE6]/40 cursor-pointer transition-all font-mono text-sm tracking-widest">WA</div>
            <div className="w-12 h-12 rounded-sm border border-[#EFECE6]/20 flex items-center justify-center text-[#EFECE6] hover:bg-[#EFECE6]/10 hover:border-[#EFECE6]/40 cursor-pointer transition-all font-mono text-sm tracking-widest">TG</div>
          </div>
          <p className="text-sm font-normal text-[#EFECE6]/60 leading-relaxed uppercase tracking-widest">
            Ответим в рабочие часы.<br/>
            Уже защитили <span className="text-[#CDFF00]">120 000 га</span> в 2025.
          </p>
        </motion.div>

        {/* Huge Aesthetic Label */}
        <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none">
          <div className="text-[15rem] font-display font-bold leading-none origin-bottom-right -rotate-90 translate-x-[20%]">
            GRIPIL
          </div>
        </div>

      </div>
      
      {/* Bottom Legal Panel */}
      <div className="relative z-10 w-full bg-[#112118] border-t border-[#EFECE6]/5 mt-16 font-mono text-[10px] uppercase tracking-widest text-[#EFECE6]/40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 GRIPIL. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-[#CDFF00] transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-[#CDFF00] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
