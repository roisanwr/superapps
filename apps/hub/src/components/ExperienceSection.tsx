"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experienceData } from "@/config/data";
import { clsx } from "clsx";

export default function ExperienceSection() {
  const [activeTabId, setActiveTabId] = useState(experienceData[0].id);

  const activeIndex = experienceData.findIndex((tb) => tb.id === activeTabId);
  const activeExp = experienceData[activeIndex];

  return (
    <motion.section
      initial={{ y: 80, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className="py-24 md:py-32 scroll-mt-20 max-w-3xl mx-auto"
      id="experience"
    >
      <div className="flex items-center gap-4 mb-10">
        <h3 className="text-2xl md:text-3xl font-bold text-[#334155] dark:text-[#F1F5F9] flex items-center">
          <span className="font-mono text-[#4F46E5] dark:text-[#818CF8] text-xl mr-2">
            02.
          </span>{" "}
          Where I’ve Worked
        </h3>
        <div className="h-[1px] bg-[#E2E8F0] dark:bg-[#334155] flex-grow"></div>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible font-mono text-xs whitespace-nowrap relative border-b border-[#E2E8F0] md:border-b-0 md:border-l md:border-[#334155]">
          {experienceData.map((exp) => {
            const isActive = activeTabId === exp.id;
            return (
              <button
                key={exp.id}
                onClick={() => setActiveTabId(exp.id)}
                className={clsx(
                  "relative h-12 px-5 text-left transition-colors duration-300 w-[120px] md:w-auto shrink-0",
                  isActive
                    ? "text-[#4F46E5] dark:text-[#818CF8] bg-[#F1F5F9] dark:bg-[#1E293B]"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/50 hover:text-[#4F46E5] dark:hover:text-[#818CF8]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 h-[2px] w-full md:w-[2px] md:h-full bg-[#4F46E5] dark:bg-[#818CF8] z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {exp.company}
              </button>
            );
          })}
        </div>
        <div className="flex-grow space-y-6 relative min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTabId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h4 className="text-xl font-bold text-[#334155] dark:text-[#F1F5F9]">
                {activeExp.role}{" "}
                <span className="text-[#4F46E5] dark:text-[#818CF8]">
                  @ {activeExp.company}
                </span>
              </h4>
              <p className="font-mono text-xs mt-1 text-[#64748B] dark:text-[#94A3B8]">
                {activeExp.duration}
              </p>
              <ul className="space-y-4 mt-6">
                {activeExp.achievements.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <span className="text-[#4F46E5] dark:text-[#818CF8] mt-1 shrink-0">
                      ▹
                    </span>
                    <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
