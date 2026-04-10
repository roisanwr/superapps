export const siteConfig = {
  name: "Rois", // Dummy placeholder, change later
  email: "roisanwar44@gmail.com", // Dummy placeholder
  navLinks: [
    { name: "About", href: "#about" },
    { name: "Experience", href: "#experience" },
    { name: "Work", href: "#work" },
    { name: "Contact", href: "#contact" },
  ],
  socials: {
    github: "https://github.com/",
    linkedin: "https://linkedin.com/",
    twitter: "https://twitter.com/",
    codepen: "https://codepen.io/",
  },
};

export const heroData = {
  greeting: "Hi, my name is",
  name: "Rois Anwar.", // Dummy placeholder
  typedStrings: [
    "things for the web.",
    "pixel-perfect UIs.",
    "scalable applications.",
    "interactive experiences.",
  ],
  description:
    "I’m a software engineer specializing in building (and occasionally designing) exceptional digital experiences. Currently, I’m focused on building accessible, human-centered products at Upstatement.",
  ctaText: "Find more about me!",
  ctaLink: "https://brittanychiang.com",
};

export const aboutData = {
  paragraphs: [
    "Hello! My name is Brittany and I enjoy creating things that live on the internet. My interest in web development started back in 2012 when I decided to try editing custom Tumblr themes — turns out hacking together a custom reblog button taught me a lot about HTML & CSS!",
    "Fast-forward to today, and I’ve had the privilege of working at an advertising agency, a start-up, a huge corporation, and a student-led design studio. My main focus these days is building accessible, inclusive products and digital experiences at Upstatement for a variety of clients.",
  ],
  technologies: [
    "JavaScript (ES6+)",
    "TypeScript",
    "React",
    "Eleventy",
    "Node.js",
    "WordPress",
  ],
  profileImage: "/images/fotoku.png",
};

export const experienceData = [
  {
    id: "upstatement",
    company: "Upstatement",
    role: "Lead Engineer",
    duration: "May 2018 — Present",
    achievements: [
      "Deliver high-quality, robust production code for a diverse array of projects for clients including Harvard Business School, Everytown for Gun Safety, and more.",
      "Work closely with designers, artists, and other developers to transform creative concepts into production realities for clients and stakeholders.",
      "Provide leadership within engineering department through close collaboration, knowledge shares, and mentorship.",
    ],
  },
  {
    id: "scout",
    company: "Scout",
    role: "Studio Developer",
    duration: "Jan 2018 — April 2018",
    achievements: [
      "Collaborated with a small team of student designers to spearhead a new brand and design system for Scout’s inaugural student-led design conference at Northeastern.",
      "Worked closely with designers and management team to develop, document, and manage the conference’s marketing website using Jekyll, Sass, and JavaScript.",
    ],
  },
  {
    id: "apple",
    company: "Apple",
    role: "UI Engineer Co-op",
    duration: "July 2017 — Dec 2017",
    achievements: [
      "Developed and shipped highly interactive web applications for Apple Music using Ember.js.",
      "Built and shipped the Apple Music Extension within Facebook Messenger leveraging third-party and internal APIs.",
    ],
  },
];

export const workData = [
  {
    title: "Halcyon Theme",
    isFeatured: true,
    description:
      "A minimal, dark blue theme for VS Code, Sublime Text, Atom, iTerm, and more. Available on Visual Studio Marketplace, Package Control, Atom Package Manager, and npm.",
    tech: ["VS Code", "Sublime Text", "Atom", "iTerm2", "Hyper"],
    githubLink: "#",
    externalLink: "#",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0MG-mRuQoD2Jh-fTp-fMtSIto7CG1iqeap1cLNHM1tXZlqxWKUZZu43NkzR6W-KS7RiKOqZobzf4XWR7pGVPnm5K70nGdTAjn-NAkzM1MV3p-8XSeLmtAWBla0oCkZd4bPmjztFXrvV65XOZ66qH9MtWt3IxFUfgFOY3ereQ4ldOFBeX5BEgyv-eViuHD68EXAVGWQJ6-rfkikBX9iXf-5tbW-vAU6l3xTAx4gokfpjSzB-zF4ezUQNX-_Gs5oZpu75ZmQG2TnUc",
  },
  {
    title: "Spotify Profile",
    isFeatured: true,
    description:
      "A web app for visualizing personalized Spotify data. View your top artists, top tracks, recently played tracks, and detailed audio information about each track.",
    tech: ["React", "Styled Components", "Spotify API", "Heroku"],
    githubLink: "#",
    externalLink: "#",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAX4Vy_SzSnWlRYwKkvY_J9s6w2N_0qJtfffLqQ2Ea-KYQCzjvuV89y4aB4mD21MbgXcjqnnMEEiZ5QH9nRK5cV2eUSvZpDWjG3jN9SO3-_qgh7AfqRRDbN1qGRV7EzNVQD1m6vuRfA0jx-3IRtHhJTtAAz2nbFUa5ILkSdjwB44hjWkKSzI-MMsXoyKIKXCs8Vzbf5ap0avCa_JpEqWW4JAwGJEifhICLXUmyq4iItgb7eADPgBH_Zgn-CGTKUFWoeruraJXHMpO8",
  },
];

export const contactData = {
  header: "04. What's Next?",
  title: "Get In Touch",
  description:
    "Although I’m not currently looking for any new opportunities, my inbox is always open. Whether you have a question or just want to say hi, I’ll try my best to get back to you!",
  ctaText: "Say Hello",
  ctaLink: "mailto:hello@brittanychiang.com", // Dummy placeholder
};

export const footerData = {
  text: "Built by Brittany Chiang / Adapted to Next.js by AI",
  links: [
    { label: "Design Strategy", href: "#" },
    { label: "Documentation", href: "#" },
  ],
};
