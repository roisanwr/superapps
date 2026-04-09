"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function ProjectsSection() {
  const projects = [
    {
      title: "MyKanz",
      desc: "Platform manajemen keuangan elegan dengan integrasi asset, budget, dan goal tracking.",
      image: "finance",
      link: "/finance",
      tags: ["Next.js", "PostgreSQL", "Supabase"],
      color: "from-emerald-500/20 to-transparent",
      accent: "text-emerald-400",
    },
    {
      title: "BitMove",
      desc: "Gamified fitness tracker. Ubah misi dunia nyata dan workout menjadi poin exp ala RPG.",
      image: "quests",
      link: "/quests",
      tags: ["RPG Engine", "Tailwind", "Turborepo"],
      color: "from-blue-500/20 to-transparent",
      accent: "text-blue-400",
    }
  ];

  return (
    <section className="py-24 relative bg-zinc-950/50" id="projects">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Super Apps</h2>
          <p className="text-zinc-400 text-lg max-w-xl">
            Satu identitas, berbagai utilitas. Coba aplikasi dalam ekosistem ini secara langsung.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, idx) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="p-8 pb-0 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-3xl font-bold">{project.title}</h3>
                  <Link 
                    href={project.link}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group/btn"
                  >
                    <ArrowUpRight className="w-5 h-5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
                
                <p className="text-zinc-400 mb-6 min-h-[48px]">{project.desc}</p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mockup Placeholder */}
              <div className="relative z-10 w-full h-[250px] bg-zinc-900 border-t border-white/10 rounded-t-2xl mt-4 mx-8 shadow-2xl overflow-hidden flex items-center justify-center">
                 <div className={`text-2xl font-bold blur-[1px] opacity-30 ${project.accent}`}>
                   {project.image.toUpperCase()} PREVIEW
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
