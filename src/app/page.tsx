import { Navbar } from "@/components/sections/navbar";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy load heavy components for better initial load
const HeroSection = dynamic(() => import("@/components/sections/hero-section"), {
  loading: () => <div className="h-screen" />,
});
const StandoutFeatures = dynamic(() => import("@/components/sections/standout-features"));
const PerformanceStats = dynamic(() => import("@/components/sections/performance-stats"));
const HowItWorks = dynamic(() => import("@/components/sections/how-it-works").then(mod => ({ default: mod.HowItWorks })));
const FAQ = dynamic(() => import("@/components/sections/faq"));
const Reviews = dynamic(() => import("@/components/sections/reviews"));
const ContactUs = dynamic(() => import("@/components/sections/contact-us"));
const Footer = dynamic(() => import("@/components/sections/footer"));

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={<div className="h-screen" />}>
        <HeroSection />
      </Suspense>
      <Suspense>
        <StandoutFeatures />
      </Suspense>
      <Suspense>
        <PerformanceStats />
      </Suspense>
      <Suspense>
        <HowItWorks />
      </Suspense>
      <Suspense>
        <FAQ />
      </Suspense>
      <Suspense>
        <Reviews />
      </Suspense>
      <Suspense>
        <ContactUs />
      </Suspense>
      <Suspense>
        <Footer />
      </Suspense>
    </main>
  );
}
