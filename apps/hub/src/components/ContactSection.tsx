"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa6";
import Link from "next/link";

export default function ContactSection() {
  const socials = [
    { icon: <FaGithub className="w-5 h-5" />, href: "#", name: "GitHub" },
    { icon: <FaLinkedin className="w-5 h-5" />, href: "#", name: "LinkedIn" },
    { icon: <FaTwitter className="w-5 h-5" />, href: "#", name: "Twitter" },
    { icon: <Mail className="w-5 h-5" />, href: "#", name: "Email" },
  ];

  return (
    <section className="py-24 relative overflow-hidden" id="contact">
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-accent-glow blur-[150px] opacity-10" />
      </div>

      <div className="max-w-3xl mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Let&apos;s Connect</h2>
          <p className="text-zinc-400 text-lg mb-8">
            Punya penawaran menarik atau sekadar ingin menyapa? Jangan ragu untuk menghubungi.
          </p>

          <div className="flex justify-center gap-4 mb-8">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all text-zinc-300 hover:text-white"
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>

          <Link
            href="mailto:hello@roisanwr.me"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-accent text-white font-medium hover:bg-blue-600 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            Say Hello <Mail className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
