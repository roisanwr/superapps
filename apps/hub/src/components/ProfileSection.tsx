"use client";

import { motion } from "framer-motion";
import { aboutData } from "@/config/data";

export default function ProfileSection() {
  return (
    <motion.section
      initial={{ y: 80, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className="py-24 md:py-32 scroll-mt-20"
      id="about"
    >
      <div className="flex items-center gap-4 mb-10">
        <h3 className="text-2xl md:text-3xl font-bold text-[#334155] dark:text-[#F1F5F9] flex items-center">
          <span className="font-mono text-[#4F46E5] dark:text-[#818CF8] text-xl mr-2">
            01.
          </span>{" "}
          About Me
        </h3>
        <div className="h-[1px] bg-[#E2E8F0] dark:bg-[#334155] flex-grow max-w-xs"></div>
      </div>
      <div className="grid md:grid-cols-5 gap-12">
        <div className="md:col-span-3 space-y-4 text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
          {aboutData.paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
          <p>Here are a few technologies I’ve been working with recently:</p>
          <ul className="grid grid-cols-2 font-mono text-xs gap-2 list-none mt-4">
            {aboutData.technologies.map((tech) => (
              <li key={tech} className="flex items-center gap-2">
                <span className="text-[#4F46E5] dark:text-[#818CF8] text-[10px]">
                  ▹
                </span>{" "}
                {tech}
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2 flex justify-center">
          <div className="relative group max-w-[300px] w-full">
            {/* The image wrapper with a solid background to protect against dark voids */}
            <div className="relative bg-white dark:bg-slate-200 rounded overflow-hidden z-10">
              <img
                alt="Profile"
                className="grayscale hover:grayscale-0 transition-all duration-500 object-cover w-full h-[350px]"
                src={aboutData.profileImage}
              />
              <div className="absolute inset-0 bg-[#4F46E5]/10 dark:bg-[#818CF8]/10 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            {/* The decorative frame rendered ON TOP so it crosses the image reliably in both modes */}
            <div className="absolute inset-0 border-2 border-[#4F46E5] dark:border-[#818CF8] rounded translate-x-5 translate-y-5 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform duration-300 pointer-events-none z-20"></div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
