"use client";

import { motion } from "framer-motion";

const categories = [
  {
    title: "The Foundation",
    items: ["HTML5 / Semantic Web", "Modern JavaScript (ES6+)", "TypeScript Architecture", "RESTful API Design"],
    highlight: -1,
  },
  {
    title: "The Structure",
    items: ["Next.js (App Router)", "React.js Ecosystem", "Node.js Runtime", "Express / Fastify"],
    highlight: 0,
  },
  {
    title: "The Aesthetics",
    items: ["Tailwind CSS", "Framer Motion", "CSS Modules / SCSS", "Figma Prototyping"],
    highlight: -1,
  },
];

export default function ToolkitsSection() {
  return (
    <section className="py-24 bg-surface-container-low/50 border-y border-outline-variant/20 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-12">
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:justify-between md:items-end border-b border-outline-variant/30 pb-8">
          <motion.h2
            className="text-3xl md:text-5xl font-headline font-light"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            My Digital <br />
            <span className="italic text-on-surface-variant">Workspace</span>
          </motion.h2>
          <motion.p
            className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant mt-6 md:mt-0"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            The tools I use to bring ideas to life
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.title}
              className="space-y-8"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: ci * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h3 className="font-label text-xs uppercase tracking-widest text-primary border-l-2 border-primary pl-4">
                {cat.title}
              </h3>
              <ul className="space-y-4 font-headline text-xl md:text-2xl font-light text-on-surface-variant">
                {cat.items.map((item, ii) => (
                  <motion.li
                    key={item}
                    className={`cursor-default transition-colors duration-200 ${
                      cat.highlight === ii ? "text-on-surface" : "hover:text-on-surface"
                    }`}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: ci * 0.1 + ii * 0.07 + 0.2 }}
                    whileHover={{ x: 8 }}
                  >
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
