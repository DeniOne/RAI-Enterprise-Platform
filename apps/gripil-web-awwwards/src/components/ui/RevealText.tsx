"use client";

import { motion } from "framer-motion";

export function RevealText({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: -90,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-wrap gap-x-3 gap-y-2 ${className}`}
      style={{ perspective: "1000px" }}
    >
      {words.map((word, index) => (
        <motion.span variants={child} key={index} style={{ transformOrigin: "bottom center" }} className="inline-block">
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}
