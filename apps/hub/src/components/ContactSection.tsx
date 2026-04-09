"use client";

import { motion } from "framer-motion";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="py-24 md:py-48 px-6 md:px-12 max-w-screen-2xl mx-auto flex flex-col md:flex-row items-start justify-between border-t border-outline-variant/20 overflow-hidden"
    >
      <motion.div
        className="max-w-xl"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-5xl md:text-6xl font-headline font-light mb-8">
          Let&apos;s build <br />something great.
        </h2>
        <p className="text-lg md:text-xl font-light text-on-surface-variant leading-relaxed">
          Always open to discussing new projects, creative ideas, or opportunities to
          be part of your next big vision.
        </p>
      </motion.div>

      <motion.div
        className="mt-12 md:mt-0 flex flex-col space-y-6 items-start md:items-end"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <a
          href="mailto:hello@roisanwr.me"
          className="text-3xl md:text-4xl font-headline font-light hover:italic transition-all duration-300"
        >
          hello@roisanwr.me
        </a>
        <p className="font-label text-xs tracking-widest uppercase opacity-50">
          Response time: 24-48 hours
        </p>
      </motion.div>
    </section>
  );
}
