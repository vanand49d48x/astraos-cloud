"use client";

import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Check, Copy, Terminal, Code2, ArrowRight } from "lucide-react";

const TABS = [
  {
    label: "Python",
    lang: "python",
    filename: "search.py",
    code: `import astra

client = astra.create_client("astra_sk_live_...")

# Search all providers in one call
results = client.search(
    bbox=(-122.5, 37.7, -122.3, 37.9),
    datetime="2025-01-01/2026-01-01",
    cloud_cover_lt=20,
)

print(f"Found {len(results.features)} scenes")
# → Found 12 scenes

# Run NDVI analysis
job = client.submit_job("ndvi", results.features[0].id)
done = client.poll_job(job.job_id)
print(done.result_url)  # → COG ready`,
  },
  {
    label: "JavaScript",
    lang: "javascript",
    filename: "search.ts",
    code: `import { createClient } from '@astra/sdk';

const astra = createClient({ apiKey: 'astra_sk_live_...' });

// Search all providers in one call
const results = await astra.search({
  bbox: [-122.5, 37.7, -122.3, 37.9],
  datetime: '2025-01-01/2026-01-01',
  cloudCoverLt: 20,
});

console.log(\`Found \${results.features.length} scenes\`);
// → Found 12 scenes

// Get COG asset URLs
const assets = await astra.assets.list({
  sceneId: results.features[0].id,
  bands: ['red', 'nir'],
});`,
  },
  {
    label: "cURL",
    lang: "bash",
    filename: "terminal",
    code: `# Search all providers — one request
curl "https://www.astraos.cloud/api/v1/search?\\
  bbox=-122.5,37.7,-122.3,37.9&\\
  datetime=2025-01-01/2026-01-01&\\
  cloud_cover_lt=20" \\
  -H "Authorization: Bearer astra_sk_live_..."

# Response (STAC FeatureCollection)
{
  "type": "FeatureCollection",
  "features": [...],
  "context": {
    "returned": 12,
    "matched": 47
  }
}`,
  },
];

const FEATURES = [
  { icon: "⚡", text: "Results in ~400ms" },
  { icon: "📦", text: "Zero format conversion" },
  { icon: "🔑", text: "One API key, all providers" },
  { icon: "📐", text: "STAC + COG standard output" },
];

const STAC_OUTPUT = `{
  "id": "sentinel-2-l2a:S2B_20250114...",
  "properties": {
    "datetime": "2025-01-14T18:49:39Z",
    "eo:cloud_cover": 4.2,
    "astra:provider": "sentinel-2-l2a",
    "platform": "sentinel-2b",
    "gsd": 10
  },
  "assets": {
    "red":  { "href": "...", "astra:is_cog": true },
    "nir":  { "href": "...", "astra:is_cog": true }
  }
}`;

// Line-by-line highlight colors
function getLineColor(line: string, lang: string): string {
  if (line.startsWith("#") || line.startsWith("//")) return "text-muted-foreground/50";
  if (lang === "python") {
    if (line.startsWith("import") || line.startsWith("from")) return "text-purple-400";
    if (line.includes("print(")) return "text-yellow-400/80";
    if (line.includes("client.") || line.includes("job.") || line.includes("done.")) return "text-blue-300";
    if (line.includes('"""') || line.includes("'")) return "text-green-400/80";
  }
  if (lang === "javascript") {
    if (line.startsWith("import") || line.startsWith("from")) return "text-purple-400";
    if (line.includes("console.log")) return "text-yellow-400/80";
    if (line.includes("await") || line.includes("const") || line.includes("let")) return "text-blue-300";
  }
  if (lang === "bash") {
    if (line.startsWith("curl")) return "text-blue-400";
    if (line.startsWith("{") || line.startsWith("}") || line.startsWith('"')) return "text-green-400/80";
    if (line.startsWith("-H")) return "text-orange-400/80";
  }
  return "text-foreground/80";
}

export function ForDevelopers() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const codeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(codeRef, { once: true, margin: "-50px" });

  const lines = TABS[activeTab].code.split("\n");

  // Typewriter reveal: show one line at a time when in view
  useEffect(() => {
    if (!isInView) return;
    setVisibleLines(0);
    const timer = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= lines.length) {
          clearInterval(timer);
          return v;
        }
        return v + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, activeTab]);

  function copy() {
    navigator.clipboard.writeText(TABS[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function switchTab(i: number) {
    setActiveTab(i);
    setVisibleLines(0);
  }

  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="primary" className="mb-4">For Developers</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Integrate in{" "}
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              5 lines of code
            </motion.span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Official SDKs for Python and JavaScript. REST API for everything else.
            Same response shape regardless of which satellite the data came from.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── Left: feature tiles + live response ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="rounded-xl border border-white/[0.07] bg-card p-4 flex items-center gap-3"
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-sm text-muted-foreground">{f.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Live response panel */}
            <motion.div
              className="rounded-xl border border-white/[0.07] bg-[#08080f] overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">STAC Item — standardized output</span>
              </div>
              <pre className="p-4 text-[11px] font-mono text-foreground/70 leading-relaxed overflow-x-auto">
                {STAC_OUTPUT}
              </pre>
            </motion.div>

            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
            >
              <Link href="/docs">
                <Button variant="outline" className="gap-2">
                  <Code2 className="w-4 h-4" />
                  Read the Docs
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="gap-2">
                  Get API Key
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Right: animated code editor ── */}
          <motion.div
            ref={codeRef}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-white/[0.08] bg-[#08080f] overflow-hidden shadow-2xl"
          >
            {/* Tab bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex">
                {TABS.map((tab, i) => (
                  <button
                    key={tab.label}
                    onClick={() => switchTab(i)}
                    className={`px-4 py-2.5 text-xs font-medium transition-all cursor-pointer border-b-2 ${
                      activeTab === i
                        ? "border-primary text-foreground bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Filename */}
            <div className="px-4 py-1.5 border-b border-white/[0.04] bg-white/[0.01]">
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {TABS[activeTab].filename}
              </span>
            </div>

            {/* Code with line-by-line reveal */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-mono">
                <tbody>
                  {lines.map((line, i) => (
                    <motion.tr
                      key={`${activeTab}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: i < visibleLines ? 1 : 0 }}
                      transition={{ duration: 0.05 }}
                      className="hover:bg-white/[0.02]"
                    >
                      <td className="pl-4 pr-4 py-0 text-muted-foreground/25 text-right select-none w-8 text-[10px]">
                        {i + 1}
                      </td>
                      <td className="pr-4 py-0.5">
                        <code className={`leading-relaxed whitespace-pre ${getLineColor(line, TABS[activeTab].lang)}`}>
                          {line}
                          {/* Blinking cursor on last visible line */}
                          {i === visibleLines - 1 && visibleLines < lines.length && (
                            <motion.span
                              className="inline-block w-[7px] h-[13px] bg-primary/80 ml-0.5 align-middle"
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            />
                          )}
                        </code>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-4" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
