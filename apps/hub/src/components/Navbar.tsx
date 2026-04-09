"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/data";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(Math.max(0, currentScrollY));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (!mounted) return null;

  return (
    <nav
      className={cn(
        "fixed top-0 w-full z-40 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md flex justify-between items-center px-6 py-4 md:px-12 transition-transform duration-300 ease-in-out",
        showNavbar ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <a
        href="#"
        className="group text-[#4F46E5] dark:text-[#818CF8] w-10 h-10 relative flex items-center justify-center transition-all duration-300 hover:-translate-y-1"
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full fill-none stroke-current"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="50 5, 90 27.5, 90 72.5, 50 95, 10 72.5, 10 27.5"></polygon>
        </svg>
        <span className="font-bold text-xl font-mono text-[#4F46E5] dark:text-[#818CF8]">
          {siteConfig.name.charAt(0)}
        </span>
      </a>
      <div className="hidden md:flex items-center gap-8">
        {siteConfig.navLinks.map((link, i) => (
          <a
            key={link.name}
            className="font-mono text-xs tracking-widest text-[#334155] dark:text-[#F1F5F9] hover:text-[#4F46E5] dark:hover:text-[#818CF8] transition-all duration-300"
            href={link.href}
          >
            0{i + 1}. {link.name}
          </a>
        ))}
        <button className="border border-[#4F46E5] dark:border-[#818CF8] text-[#4F46E5] dark:text-[#818CF8] px-4 py-2 font-mono text-xs rounded hover:bg-[#4F46E5]/10 dark:hover:bg-[#818CF8]/10 transition-all duration-300">
          Resume
        </button>
      </div>
    </nav>
  );
}
