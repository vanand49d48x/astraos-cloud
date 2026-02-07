import { Hero } from "@/components/marketing/hero";
import { LiveSearchDemo } from "@/components/marketing/live-search-demo";
import { PainPoints } from "@/components/marketing/pain-points";
import { CodeExample } from "@/components/marketing/code-example";
import { DataSources } from "@/components/marketing/data-sources";
import { UseCasesSection } from "@/components/marketing/use-cases-section";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <div>
      <section id="hero">
        <Hero />
      </section>
      <section id="demo">
        <LiveSearchDemo />
      </section>
      <section id="features">
        <PainPoints />
      </section>
      <section id="code">
        <CodeExample />
      </section>
      <section id="data-sources">
        <DataSources />
      </section>
      <section id="use-cases">
        <UseCasesSection />
      </section>
      <section id="pricing">
        <CTASection />
      </section>
    </div>
  );
}
