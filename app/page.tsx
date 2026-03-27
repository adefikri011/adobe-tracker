"use client";

import Navbar from "./components/landing/Navbar";
import HeroSection from "./components/landing/HeroSection";
import StatsSection from "./components/landing/StatsSection";
import FeaturesSection from "./components/landing/FeaturesSection";
import TestimonialsSection from "./components/landing/TestimonialsSection";
import CTASection from "./components/landing/CTASection";
import Footer from "./components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <Navbar />

      {/* ── HERO SECTION ── */}
      <HeroSection />

      {/* ── STATS SECTION ── */}
      <StatsSection />

      {/* ── FEATURES SECTION ── */}
      <FeaturesSection />

      {/* ── TESTIMONIALS SECTION ── */}
      <TestimonialsSection />

      {/* ── CTA SECTION ── */}
      <CTASection />

      {/* ── FOOTER ── */}
      <Footer />
    </main>
  );
}