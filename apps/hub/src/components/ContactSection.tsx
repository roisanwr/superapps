"use client";

import { motion } from "framer-motion";
import { contactData } from "@/config/data";

export default function ContactSection() {
  return (
    <motion.section
      initial={{ y: 80, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.5 }}
      className="py-24 md:py-48 text-center max-w-2xl mx-auto mb-20"
      id="contact"
    >
      <p className="font-mono text-[#4F46E5] dark:text-[#818CF8] text-sm mb-4">
        {contactData.header}
      </p>
      <h2 className="text-4xl md:text-6xl font-bold text-[#334155] dark:text-[#F1F5F9] mb-6">
        {contactData.title}
      </h2>
      <p className="text-[#64748B] dark:text-[#94A3B8] mb-12">
        {contactData.description}
      </p>
      <a
        className="inline-block border-2 border-[#4F46E5] dark:border-[#818CF8] text-[#4F46E5] dark:text-[#818CF8] px-10 py-5 font-mono text-sm rounded hover:bg-[#4F46E5]/10 dark:hover:bg-[#818CF8]/10 transition-all duration-300"
        href={contactData.ctaLink}
      >
        {contactData.ctaText}
      </a>
    </motion.section>
  );
}
