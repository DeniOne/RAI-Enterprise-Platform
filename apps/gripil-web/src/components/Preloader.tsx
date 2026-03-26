"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    // Анимация счетчика от 0 до 100
    let start = 0;
    const end = 100;
    const duration = 2000; // 2 секунды
    const stepTime = Math.abs(Math.floor(duration / end));

    const timer = setInterval(() => {
      start += 1;
      setCounter(start);
      if (start === end) {
        clearInterval(timer);
        setTimeout(() => {
          setIsLoading(false);
          // Разблокируем скролл после прелоадера
          document.body.style.overflow = "auto";
        }, 500); // Небольшая пауза на 100%
      }
    }, stepTime);

    // Блокируем скролл во время загрузки
    document.body.style.overflow = "hidden";

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "auto";
    };
  }, []);

  // Разбиваем слово на буквы для stagger-анимации
  const word = "GRIPIL";

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: "-100vh", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#112118] text-[#EFECE6] px-8 py-12"
        >
          <div className="w-full flex justify-between items-start font-mono text-xs md:text-sm uppercase tracking-widest opacity-50">
            <span>Инициализация 3D среды</span>
            <span>v.1.0.0</span>
          </div>

          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex overflow-hidden">
              {word.split("").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: i * 0.1, 
                    ease: [0.76, 0, 0.24, 1] 
                  }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-display uppercase font-medium leading-[0.8]"
                >
                  {char}
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-[#CDFF00] font-mono text-2xl md:text-3xl lg:text-4xl"
            >
              {counter}%
            </motion.div>
          </div>

          <div className="w-full flex justify-between items-end font-mono text-xs md:text-sm uppercase tracking-widest opacity-50">
            <span>© {new Date().getFullYear()} RAI</span>
            <span>Защита урожая</span>
          </div>
          
          {/* Progress bar line at the absolute bottom */}
          <motion.div 
            className="absolute bottom-0 left-0 h-1 bg-[#CDFF00]"
            initial={{ width: "0%" }}
            animate={{ width: `${counter}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
