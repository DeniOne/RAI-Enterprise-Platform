"use client";

import { useEffect, useState } from "react";
import { useSpring, useTransform, motion } from "framer-motion";

interface CountUpProps {
  to: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
}

export default function CountUp({ to, duration = 2, delay = 0, suffix = "", prefix = "" }: CountUpProps) {
  const [inView, setInView] = useState(false);
  const springValue = useSpring(0, {
    bounce: 0,
    duration: duration * 1000,
  });

  const displayValue = useTransform(springValue, (latest) => 
    Math.round(latest).toLocaleString('ru-RU')
  );

  useEffect(() => {
    if (inView) {
      setTimeout(() => {
        springValue.set(to);
      }, delay * 1000);
    }
  }, [inView, to, delay, springValue]);

  return (
    <motion.span 
      onViewportEnter={() => setInView(true)}
      viewport={{ once: true }}
      className="inline-flex font-display tabular-nums"
    >
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </motion.span>
  );
}
