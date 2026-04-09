import Hero from "@/components/Hero";
import AboutSection from "@/components/AboutSection";
import ProjectsSection from "@/components/ProjectsSection";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />
    </main>
  );
}
