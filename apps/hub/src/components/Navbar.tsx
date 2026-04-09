"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const navLinks = [
  { label: "Work", href: "#" },
  { label: "About", href: "#profile" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex justify-between items-center px-6 md:px-12 py-6 max-w-screen-2xl mx-auto">
        <motion.a
          href="#"
          className="font-headline text-xl md:text-2xl font-light tracking-tighter"
          whileHover={{ letterSpacing: "-0.06em" }}
          transition={{ duration: 0.3 }}
        >
          Architectural Editorial
        </motion.a>

        <div className="hidden md:flex items-center space-x-12 font-headline tracking-tight text-lg">
          {navLinks.map(({ label, href }, i) => (
            <motion.a
              key={label}
              href={href}
              className="relative text-primary/60 hover:text-primary transition-colors duration-300"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i + 0.4, duration: 0.5 }}
            >
              {label}
              <motion.span
                className="absolute -bottom-0.5 left-0 h-px bg-primary"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.25 }}
              />
            </motion.a>
          ))}
        </div>

        <motion.button
          className="bg-primary text-on-primary px-6 md:px-8 py-2 md:py-3 font-label text-xs uppercase tracking-widest hover:bg-primary-dim transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          whileHover={{ letterSpacing: "0.2em" }}
          whileTap={{ scale: 0.97 }}
        >
          Hire Me
        </motion.button>
      </div>
    </motion.nav>
  );
}
