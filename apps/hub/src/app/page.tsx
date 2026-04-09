import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProfileSection from "@/components/ProfileSection";
import ToolkitsSection from "@/components/ToolkitsSection";
import ProjectsSection from "@/components/ProjectsSection";
import NarrativeSection from "@/components/NarrativeSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";

export default function Home() {
  return (
    <>
      <CustomCursor />
      <Navbar />
      <main className="pt-32">
        <HeroSection />
        <ProfileSection />
        <ToolkitsSection />
        <ProjectsSection />
        <NarrativeSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
