import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/sections/Hero";
import LogoCloud from "../components/sections/LogoCloud";
import Features from "../components/sections/Features";
import ImageText from "../components/sections/ImageText";
import Stats from "../components/sections/Stats";
import Testimonials from "../components/sections/Testimonials";
import FAQ from "../components/sections/FAQ";
import CTA from "../components/sections/CTA";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FBFAF6] antialiased">
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <ImageText />
        <Stats />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}