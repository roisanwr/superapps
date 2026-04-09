"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const lines = [
  { text: "Logic.", italic: false },
  { text: "Design.", italic: true },
  { text: "Flow.", italic: false },
];

function MaskLine({ text, italic, delay }: { text: string; italic: boolean; delay: number }) {
  return (
    <div className="overflow-hidden">
      <motion.div
        initial={{ y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className={italic ? "italic font-light opacity-80" : ""}>{text}</span>
      </motion.div>
    </div>
  );
}

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  return (
    <motion.section
      ref={ref}
      style={{ opacity, y }}
      className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
    >
      <div className="max-w-4xl w-full relative z-10 text-center">
        <motion.div
          className="absolute inset-0 bg-surface-container-low -m-12 -z-10 blur-3xl"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.6, scale: 1.1 }}
          transition={{ duration: 2.5 }}
        />

        <motion.p
          className="mb-6 font-label text-xs uppercase tracking-[0.45em] text-on-surface-variant opacity-0"
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Developer · Designer · Builder
        </motion.p>

        <h1 className="text-6xl md:text-8xl lg:text-9xl font-headline font-light tracking-tighter mb-8 md:mb-12 leading-[0.9]">
          {lines.map((l, i) => (
            <MaskLine key={l.text} {...l} delay={0.35 + i * 0.15} />
          ))}
        </h1>

        <motion.div
          className="mt-8 md:mt-12 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.9 }}
        >
          <p className="text-lg md:text-2xl font-light text-on-surface-variant leading-relaxed">
            I craft digital experiences where clean code meets intentional design.
            Minimalist aesthetics, maximum performance.
          </p>

          <div className="mt-12 md:mt-16 flex justify-center">
            <motion.div
              className="w-px bg-outline-variant"
              initial={{ height: 0 }}
              animate={{ height: "6rem" }}
              transition={{ delay: 1.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 0.8 }}
      >
        <span className="font-label text-[10px] uppercase tracking-[0.4em] text-on-surface-variant opacity-40">
          Scroll
        </span>
        <motion.div
          className="w-px h-10 bg-outline-variant origin-top"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.section>
  );
}
