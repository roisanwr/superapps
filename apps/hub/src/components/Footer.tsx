"use client";

import { FaGithub, FaLinkedin, FaTwitter, FaCodepen } from "react-icons/fa";
import { siteConfig, footerData } from "@/config/data";

export default function Footer() {
  return (
    <footer className="footer-content relative z-10 py-6 text-center">
      <div className="flex md:hidden justify-center gap-6 mb-4">
        <a
          className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8]"
          href={siteConfig.socials.github}
        >
          <FaGithub size={20} />
        </a>
        <a
          className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8]"
          href={siteConfig.socials.linkedin}
        >
          <FaLinkedin size={20} />
        </a>
        <a
          className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8]"
          href={siteConfig.socials.twitter}
        >
          <FaTwitter size={20} />
        </a>
        <a
          className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#4F46E5] dark:hover:text-[#818CF8]"
          href={siteConfig.socials.codepen}
        >
          <FaCodepen size={20} />
        </a>
      </div>
      <p className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] mb-2 hover:text-[#4F46E5] dark:hover:text-[#818CF8] cursor-pointer transition-colors">
        {footerData.text}
      </p>
      <div className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] space-x-4">
        {footerData.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="hover:text-[#4F46E5] dark:hover:text-[#818CF8] transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
