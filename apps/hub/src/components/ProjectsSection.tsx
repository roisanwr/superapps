"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const projects = [
  {
    number: "01",
    category: "E-COMMERCE",
    title: ["Seamless", "Storefronts"],
    description:
      "A high-performance headless e-commerce platform built with Next.js and Shopify. Designed to handle massive traffic spikes without dropping a single frame, keeping the shopping experience smooth and uninterrupted.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1400&auto=format&fit=crop",
    alt: "monolithic concrete architectural structure",
    reversed: false,
  },
  {
    number: "02",
    category: "SAAS PLATFORM",
    title: ["Data, made", "Beautiful"],
    description:
      "A complex real-time dashboard that turns thousands of messy data points into clean, actionable insights. Built with a focus on clear typography, intuitive navigation, and lightning-fast state management.",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1400&auto=format&fit=crop",
    alt: "modern glass building facade",
    reversed: true,
  },
];

type Project = typeof projects[0];

function ProjectCard({ project }: { project: Project }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div ref={containerRef} className="relative grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0 items-center">
      {/* Image */}
      <motion.div
        className={`md:col-span-7 relative z-10 overflow-hidden ${project.reversed ? "order-1 md:order-2" : ""}`}
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.img
          /* eslint-disable-next-line @next/next/no-img-element */
          style={{ y: imageY, scale: 1.12 }}
          className={`w-full h-[500px] md:h-[800px] object-cover filter ${project.reversed ? "brightness-90" : "brightness-95"}`}
          alt={project.alt}
          src={project.image}
        />
      </motion.div>

      {/* Card */}
      <motion.div
        className={`relative z-20 p-8 md:p-16 shadow-none ${
          project.reversed
            ? "md:col-span-5 md:-mr-24 order-2 md:order-1 bg-surface-container-low"
            : "md:col-span-5 md:-ml-24 bg-surface"
        }`}
        initial={{ opacity: 0, x: project.reversed ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.95, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="font-label text-xs tracking-widest text-primary block mb-4 md:mb-6">
          {project.number} / {project.category}
        </span>
        <h3 className="text-3xl md:text-5xl font-headline font-light mb-6 md:mb-8 leading-tight">
          {project.title[0]} <br /> {project.title[1]}
        </h3>
        <p className="font-light text-on-surface-variant leading-loose mb-8 md:mb-12">
          {project.description}
        </p>
        <motion.a
          className="inline-block border-b border-primary pb-1 text-sm font-label tracking-widest"
          href="#"
          whileHover={{ letterSpacing: "0.18em" }}
          transition={{ duration: 0.3 }}
        >
          VIEW CASE STUDY
        </motion.a>
      </motion.div>
    </div>
  );
}

export default function ProjectsSection() {
  return (
    <section className="py-24 md:py-48 px-6 md:px-12 max-w-screen-2xl mx-auto space-y-32 md:space-y-64">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <span className="font-label text-xs tracking-widest text-primary block uppercase mb-4">Recent Builds</span>
        <h2 className="text-4xl md:text-5xl font-headline font-light">
          Featured <span className="italic text-on-surface-variant">Projects</span>
        </h2>
      </motion.div>

      {projects.map((project) => (
        <ProjectCard key={project.number} project={project} />
      ))}
    </section>
  );
}
