"use client";

import { motion } from "framer-motion";
import { EMPHATIC_EASE } from "@/lib/motion";

export function SectionReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: EMPHATIC_EASE }}
      className={`relative ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}
