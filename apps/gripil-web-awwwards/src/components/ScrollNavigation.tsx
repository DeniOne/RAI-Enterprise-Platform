"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function ScrollNavigation() {
  const [sections, setSections] = useState<HTMLElement[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Собираем все секции после монтирования
  useEffect(() => {
    // Находим все semantic <section> теги, а также footer для полноты
    const elements = Array.from(document.querySelectorAll("section, footer, header")) as HTMLElement[];
    // Фильтруем элементы с нулевой высотой и скрытые
    const visibleElements = elements.filter(el => el.offsetHeight > 50);
    setSections(visibleElements);
    
    if (visibleElements.length > 0) setIsVisible(true);
  }, []);

  // Отслеживаем скролл для обновления активного индекса
  const handleScroll = useCallback(() => {
    if (sections.length === 0) return;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const viewportOffset = viewportHeight / 3;

    // Находим секцию, которая в данный момент "владеет" зоной (верх окна + 33%)
    let newIndex = 0;
    for (let i = 0; i < sections.length; i++) {
      const el = sections[i];
      // getBoundingClientRect().top + window.scrollY дает точный абсолютный Y элемента
      const absoluteTop = el.getBoundingClientRect().top + window.scrollY;
      
      if (scrollY >= absoluteTop - viewportOffset) {
        newIndex = i;
      }
    }

    // Фикс для короткого футера: если докрутили до самого низа документа — форсируем последнюю секцию
    const isAtBottom = Math.ceil(scrollY + viewportHeight) >= document.documentElement.scrollHeight;
    if (isAtBottom) {
      newIndex = sections.length - 1;
    }

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  }, [sections, activeIndex]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Первоначальный вызов
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Навигация
  const navigateTo = (index: number) => {
    if (index >= 0 && index < sections.length) {
      sections[index].scrollIntoView({ behavior: "smooth" });
      setActiveIndex(index);
    }
  };

  const isAtTop = activeIndex === 0;
  const isAtBottom = activeIndex === sections.length - 1;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="fixed right-4 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-50 pointer-events-none hidden md:flex"
      >
        <div className="pointer-events-auto flex flex-col items-center gap-3">
          
          {/* Кнопка ВВЕРХ */}
          <button
            onClick={() => navigateTo(activeIndex - 1)}
            disabled={isAtTop}
            className={`w-10 h-10 lg:w-12 lg:h-12 flex flex-col items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 group
              ${isAtTop 
                ? 'opacity-30 border-[#112118]/10 cursor-not-allowed bg-black/20' 
                : 'opacity-100 border-[#EFECE6]/20 bg-[#112118]/60 hover:border-[#CDFF00]/50 hover:bg-[#112118]/80 hover:shadow-[0_0_15px_rgba(205,255,0,0.2)] cursor-pointer'
              }`}
            aria-label="Скролл вверх"
          >
            <ChevronUp className={`w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-300 ${isAtTop ? 'text-[#EFECE6]/50' : 'text-[#EFECE6] group-hover:text-[#CDFF00]'}`} />
          </button>

          {/* Индикатор текущей секции */}
          <div className="relative h-16 w-[1px] bg-[#EFECE6]/20 my-2">
            <motion.div 
              className="absolute left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-[#CDFF00] shadow-[0_0_8px_rgba(205,255,0,0.6)]"
              initial={false}
              animate={{ 
                top: `${(activeIndex / Math.max(1, sections.length - 1)) * 100}%`,
                height: "20%" 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                top: 0,
                translateY: "-50%"
              }}
            />
          </div>

          {/* Кнопка ВНИЗ */}
          <button
            onClick={() => navigateTo(activeIndex + 1)}
            disabled={isAtBottom}
            className={`w-10 h-10 lg:w-12 lg:h-12 flex flex-col items-center justify-center rounded-full backdrop-blur-md border transition-all duration-300 group
              ${isAtBottom 
                ? 'opacity-30 border-[#112118]/10 cursor-not-allowed bg-black/20' 
                : 'opacity-100 border-[#EFECE6]/20 bg-[#112118]/60 hover:border-[#CDFF00]/50 hover:bg-[#112118]/80 hover:shadow-[0_0_15px_rgba(205,255,0,0.2)] cursor-pointer'
              }`}
            aria-label="Скролл вниз"
          >
            <ChevronDown className={`w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-300 ${isAtBottom ? 'text-[#EFECE6]/50' : 'text-[#EFECE6] group-hover:text-[#CDFF00]'}`} />
          </button>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
