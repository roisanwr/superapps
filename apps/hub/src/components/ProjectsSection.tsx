"use client";

import { motion } from "framer-motion";
import { workData } from "@/config/data";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import { clsx } from "clsx";

export default function ProjectsSection() {
  return (
    <motion.section
      initial={{ y: 80, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.1 }}
      className="py-24 md:py-32 scroll-mt-20"
      id="work"
    >
      <div className="flex items-center gap-4 mb-14">
        <h3 className="text-2xl md:text-3xl font-bold text-[#334155] dark:text-[#F1F5F9] flex items-center">
          <span className="font-mono text-[#4F46E5] dark:text-[#818CF8] text-xl mr-2">
            03.
          </span>{" "}
          Some Things I’ve Built
        </h3>
        <div className="h-[1px] bg-[#E2E8F0] dark:bg-[#334155] flex-grow"></div>
      </div>
      <div className="space-y-24 md:space-y-40">
        {workData.map((project, i) => {
          const isLeft = i % 2 !== 0; // Alternating layout
          return (
            <div
              key={project.title}
              className="relative grid md:grid-cols-12 gap-4 items-center"
            >
              {/* Image */}
              <div
                className={clsx(
                  "md:col-span-7 relative group",
                  isLeft ? "md:col-start-6" : ""
                )}
              >
                <div className="absolute inset-0 bg-[#4F46E5]/30 dark:bg-[#818CF8]/30 group-hover:bg-transparent transition-all duration-300 rounded-lg z-10"></div>
                <img
                  alt={project.title}
                  className="rounded-lg shadow-xl object-cover w-full h-full"
                  src={project.image}
                />
              </div>

              {/* Text Content */}
              <div
                className={clsx(
                  "md:col-span-6 z-20 space-y-4",
                  isLeft
                    ? "md:absolute md:left-0 text-left"
                    : "md:col-start-7 md:absolute md:right-0 text-right"
                )}
              >
                <p className="font-mono text-[#4F46E5] dark:text-[#818CF8] text-xs">
                  {project.isFeatured ? "Featured Project" : "Project"}
                </p>
                <h4 className="text-2xl md:text-3xl font-bold text-[#334155] dark:text-[#F1F5F9] hover:text-[#4F46E5] dark:hover:text-[#818CF8] cursor-pointer transition-colors">
                  {project.title}
                </h4>
                <div className="bg-white dark:bg-[#1E293B] p-6 rounded-lg shadow-lg dark:shadow-2xl border border-[#F1F5F9] dark:border-none relative z-30">
                  <p className="text-[#64748B] dark:text-[#94A3B8]">
                    {project.description}
                  </p>
                </div>
                <ul
                  className={clsx(
                    "flex flex-wrap gap-4 font-mono text-xs text-[#334155] dark:text-[#F1F5F9]",
                    isLeft ? "justify-start" : "justify-end"
                  )}
                >
                  {project.tech.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <div
                  className={clsx(
                    "flex gap-6 text-[#334155] dark:text-[#F1F5F9]",
                    isLeft ? "justify-start" : "justify-end"
                  )}
                >
                  {project.githubLink && (
                    <a
                      href={project.githubLink}
                      target="_blank"
                      rel="noreferrer"
                      className="cursor-pointer hover:text-[#4F46E5] dark:hover:text-[#818CF8] transition-colors"
                    >
                      <FaGithub size={20} />
                    </a>
                  )}
                  {project.externalLink && (
                    <a
                      href={project.externalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="cursor-pointer hover:text-[#4F46E5] dark:hover:text-[#818CF8] transition-colors"
                    >
                      <FaExternalLinkAlt size={18} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
