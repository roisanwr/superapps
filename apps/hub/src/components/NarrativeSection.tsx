"use client";

import { motion } from "framer-motion";

const words = `"Good code works. Great code disappears, leaving only a seamless experience."`.split(" ");

export default function NarrativeSection() {
  return (
    <section className="py-48 md:py-96 flex justify-center items-center px-6 md:px-12 text-center bg-surface-container-low/50 overflow-hidden">
      <div className="max-w-3xl">
        <h3 className="text-2xl md:text-4xl font-headline italic font-light leading-relaxed text-on-surface-variant">
          {words.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.3em]"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.045, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          ))}
        </h3>
        <motion.div
          className="mt-8 font-label text-[10px] tracking-[0.5em] uppercase opacity-40"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
          transition={{ delay: words.length * 0.045 + 0.2, duration: 0.8 }}
        >
          — THE ARCHITECTURAL DEVELOPER
        </motion.div>
      </div>
    </section>
  );
}
