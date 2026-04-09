"use client";

import { motion } from "framer-motion";
import { Code2, Database, Layout } from "lucide-react";

export default function AboutSection() {
  const skills = [
    { name: "Frontend", icon: <Layout className="w-5 h-5 text-accent" />, desc: "Next.js, React, Tailwind CSS" },
    { name: "Backend", icon: <Database className="w-5 h-5 text-accent" />, desc: "Node.js, PostgreSQL, Supabase" },
    { name: "Architecture", icon: <Code2 className="w-5 h-5 text-accent" />, desc: "Turborepo, Multi-Zones, SSO" },
  ];

  return (
    <section className="py-24 relative overflow-hidden" id="about">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Crafting the Web</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
            I specialize in building full-stack applications with beautiful interfaces, solid architectures, and seamless user experiences.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
             <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-glow/20 flex items-center justify-center mb-4">
                {skill.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{skill.name}</h3>
              <p className="text-zinc-400 leading-relaxed">{skill.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
