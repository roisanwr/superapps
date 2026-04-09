"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

export default function ProfileSection() {
  const imageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: imageRef, offset: ["start end", "end start"] });
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.0]);

  return (
    <section
      id="profile"
      className="py-24 md:py-48 px-6 md:px-12 max-w-screen-2xl mx-auto overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center">
        {/* Photo */}
        <motion.div
          ref={imageRef}
          className="md:col-span-5 relative"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-full aspect-[3/4] bg-surface-container-low relative overflow-hidden group">
            {/* Curtain reveal */}
            <motion.div
              className="absolute inset-0 bg-surface z-10 origin-top"
              initial={{ scaleY: 1 }}
              whileInView={{ scaleY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.3, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.img
              /* eslint-disable-next-line @next/next/no-img-element */
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop"
              alt="Portrait of the Developer"
              style={{ scale: imageScale }}
              className="w-full h-full object-cover filter grayscale contrast-125 brightness-90 transition-transform duration-700 group-hover:scale-105"
            />
            {/* Corner accents */}
            {[
              "absolute top-4 left-4 w-4 h-px bg-primary/50",
              "absolute top-4 left-4 w-px h-4 bg-primary/50",
              "absolute bottom-4 right-4 w-4 h-px bg-primary/50",
              "absolute bottom-4 right-4 w-px h-4 bg-primary/50",
            ].map((cls, i) => (
              <motion.div
                key={i}
                className={cls}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.3 + i * 0.1, duration: 0.4 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          className="md:col-span-7 space-y-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.span variants={itemVariants} className="font-label text-xs tracking-widest text-primary block uppercase">
            Behind the Screen
          </motion.span>
          <motion.h2 variants={itemVariants} className="text-4xl md:text-6xl font-headline font-light leading-tight">
            I build the web, <br />
            <span className="italic text-on-surface-variant">one pixel at a time.</span>
          </motion.h2>
          <motion.div variants={itemVariants} className="space-y-6 text-on-surface-variant font-light leading-relaxed md:text-lg max-w-2xl">
            <p>
              Hi, I&apos;m Roisan. I&apos;ve always believed that great software should feel effortless.
              My goal isn&apos;t just to write code that works, but to build digital spaces that people
              actually enjoy using. Think of it like architecture—a solid foundation, intuitive
              navigation, and a beautiful facade.
            </p>
            <p>
              Based in Indonesia, I spend my days turning complex problems into elegant, scalable
              web applications. Whether it&apos;s crafting a buttery-smooth animation or optimizing a
              database query, I sweat the small stuff so the end user doesn&apos;t have to.
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="pt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Signature_of_John_Hancock.svg"
              alt="Signature"
              className="h-12 md:h-16 opacity-60 filter contrast-200 grayscale"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
