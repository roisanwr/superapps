"use client";

import { useEffect, useRef } from "react";
import Typed from "typed.js";
import { motion, Variants } from "framer-motion";
import { heroData } from "@/config/data";

export default function HeroSection() {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: heroData.typedStrings,
      typeSpeed: 50,
      backSpeed: 30,
      backDelay: 2000,
      loop: true,
      showCursor: true,
      cursorChar: "|",
      autoInsertCss: true,
    });

    return () => {
      typed.destroy();
    };
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 md:pt-32 overflow-hidden">
      <motion.div
        className="space-y-5 hero-content relative z-10 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          variants={itemVariants}
          className="font-mono text-[#4F46E5] dark:text-[#818CF8] tracking-widest"
        >
          {heroData.greeting}
        </motion.p>
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-8xl font-bold text-[#334155] dark:text-[#F1F5F9] tracking-tight"
        >
          {heroData.name}
        </motion.h1>
        <motion.h2
          variants={itemVariants}
          className="text-4xl md:text-7xl font-bold text-[#64748B] dark:text-[#94A3B8] tracking-tight h-[80px] md:h-[100px]"
        >
          I build <span ref={el} className="text-[#4F46E5] dark:text-[#818CF8]"></span>
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="max-w-xl text-lg md:text-xl text-[#64748B] dark:text-[#94A3B8] leading-relaxed"
        >
          {heroData.description}
        </motion.p>
        <motion.div variants={itemVariants} className="pt-10">
          <a
            href={heroData.ctaLink}
            className="inline-block border-2 border-[#4F46E5] dark:border-[#818CF8] text-[#4F46E5] dark:text-[#818CF8] px-8 py-4 font-mono text-sm rounded hover:bg-[#4F46E5]/10 dark:hover:bg-[#818CF8]/10 transition-all duration-300"
          >
            {heroData.ctaText}
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
