"use client";

import { motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center items-center overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent-glow blur-[120px] opacity-20 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 flex justify-center"
        >
          <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-zinc-300 inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Super App Ecosystem V1
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 pb-2"
        >
          Roisan Anwar
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="text-lg md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Developer & Designer building tools to manage finances, track fitness quests, and craft digital experiences.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/projects"
            className="group px-8 py-4 rounded-full bg-foreground text-background font-medium hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            Lihat Proyek
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            className="px-8 py-4 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-white flex items-center gap-2"
          >
            Hubungi Saya
            <Mail className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Decorative gradient line at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
    </section>
  );
}
