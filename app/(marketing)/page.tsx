import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PainPoints } from "@/components/marketing/pain-points";
import { LiveSearchDemo } from "@/components/marketing/live-search-demo";
import { Capabilities } from "@/components/marketing/capabilities";
import { ForDevelopers } from "@/components/marketing/for-developers";
import { ForBusiness } from "@/components/marketing/for-business";
import { DataSources } from "@/components/marketing/data-sources";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <div>
      {/* 1. Hero — what it is + live satellite imagery */}
      <section id="hero">
        <Hero />
      </section>

      {/* 2. How it works — 3 steps: Search → Analyze → Monitor */}
      <section id="how-it-works">
        <HowItWorks />
      </section>

      {/* 3. Problems it solves */}
      <section id="features">
        <PainPoints />
      </section>

      {/* 4. Full interactive demo */}
      <section id="demo">
        <LiveSearchDemo />
      </section>

      {/* 5. Intelligence layer — capabilities showcase */}
      <section id="capabilities">
        <Capabilities />
      </section>

      {/* 6. For Developers — code editor + live response */}
      <section id="developers">
        <ForDevelopers />
      </section>

      {/* 7. For Business — satellite imagery + outcome metrics */}
      <section id="business">
        <ForBusiness />
      </section>

      {/* 8. Data sources */}
      <section id="data-sources">
        <DataSources />
      </section>

      {/* 9. CTA */}
      <section id="pricing">
        <CTASection />
      </section>
    </div>
  );
}
