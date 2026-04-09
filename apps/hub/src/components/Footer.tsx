"use client";

import { motion } from "framer-motion";

const socials = ["LinkedIn", "GitHub", "Read.cv"];

export default function Footer() {
  return (
    <footer className="bg-surface-container-low w-full py-16 md:py-24 px-6 md:px-12">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-end w-full max-w-screen-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-12 md:mb-0 text-left w-full md:w-auto">
          <h4 className="font-headline italic text-xl mb-4">Architectural Editorial</h4>
          <p className="font-label text-xs uppercase tracking-widest text-primary/50">
            © 2025 Roisan Anwar. All Rights Reserved.
          </p>
        </div>

        <div className="flex flex-wrap gap-8 font-label text-xs uppercase tracking-widest">
          {socials.map((social, i) => (
            <motion.a
              key={social}
              href="#"
              className="relative text-primary/50 hover:text-primary transition-colors duration-300"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {social}
              <motion.span
                className="absolute -bottom-0.5 left-0 h-px bg-primary"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.25 }}
              />
            </motion.a>
          ))}
        </div>
      </motion.div>
    </footer>
  );
}
