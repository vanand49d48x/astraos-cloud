import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PainPoints } from "@/components/marketing/pain-points";
import { LiveSearchDemo } from "@/components/marketing/live-search-demo";
import { CodeExample } from "@/components/marketing/code-example";
import { DataSources } from "@/components/marketing/data-sources";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <div>
      {/* 1. Hero — immediate: what it is + live satellite imagery */}
      <section id="hero">
        <Hero />
      </section>

      {/* 2. How it works — 3 steps, code snippets */}
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

      {/* 5. Code examples */}
      <section id="code">
        <CodeExample />
      </section>

      {/* 6. Data sources */}
      <section id="data-sources">
        <DataSources />
      </section>

      {/* 7. Use cases */}
      <section id="use-cases">
        <UseCasesSection />
      </section>

      {/* 8. CTA */}
      <section id="pricing">
        <CTASection />
      </section>
    </div>
  );
}
