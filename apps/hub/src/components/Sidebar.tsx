"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/data";
import { FaGithub, FaLinkedin, FaTwitter, FaCodepen } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

export default function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setMounted(true);
    if (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  return (
    <>
      <aside className="fixed left-0 bottom-0 h-screen w-24 hidden md:flex flex-col justify-end items-center z-50 pointer-events-none">
        <div className="flex flex-col items-center gap-6 pointer-events-auto">
          <a
            className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8] hover:-translate-y-1 transition-transform"
            href={siteConfig.socials.github}
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub size={20} />
          </a>
          <a
            className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8] hover:-translate-y-1 transition-transform"
            href={siteConfig.socials.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            <FaLinkedin size={20} />
          </a>
          <a
            className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8] hover:-translate-y-1 transition-transform"
            href={siteConfig.socials.twitter}
            target="_blank"
            rel="noreferrer"
          >
            <FaTwitter size={20} />
          </a>
          <a
            className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8] hover:-translate-y-1 transition-transform"
            href={siteConfig.socials.codepen}
            target="_blank"
            rel="noreferrer"
          >
            <FaCodepen size={20} />
          </a>
          <div className="h-24 w-[1px] bg-[#94A3B8]"></div>
        </div>
      </aside>

      <aside className="fixed right-0 bottom-0 h-screen w-24 hidden md:flex flex-col justify-end items-center z-50 pointer-events-none">
        <div className="flex flex-col items-center gap-8 pointer-events-auto relative">
          {mounted && (
            <button
              onClick={toggleTheme}
              className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8] hover:-translate-y-1 transition-transform cursor-pointer flex items-center justify-center p-2 rounded-full hover:bg-[#4F46E5]/10 dark:hover:bg-[#818CF8]/10 my-2"
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}

          <a
            className="font-mono text-xs tracking-widest text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8] hover:-translate-y-1 transition-transform vertical-text-orientation"
            href={`mailto:${siteConfig.email}`}
          >
            {siteConfig.email}
          </a>

          <div className="h-24 w-[1px] bg-[#94A3B8]"></div>
        </div>
      </aside>
    </>
  );
}
