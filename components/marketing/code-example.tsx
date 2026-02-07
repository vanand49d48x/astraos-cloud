"use client";

import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const pythonCode = `import astra

# Search satellite imagery across all providers
scenes = astra.search(
    bbox=[-122.5, 37.5, -122.0, 38.0],
    datetime="2025-01/2025-02",
    cloud_cover_lt=20
)

print(f"Found {len(scenes)} scenes")

# Process NDVI for each scene
for scene in scenes:
    ndvi = scene.process("ndvi")
    ndvi.download("output.tif")`;

const jsCode = `import { AstraClient } from '@astraos/sdk';

const astra = new AstraClient({ apiKey: 'astra_...' });

// Search satellite imagery across all providers
const { features } = await astra.search({
  bbox: [-122.5, 37.5, -122.0, 38.0],
  datetime: '2025-01/2025-02',
  cloudCoverLt: 20,
});

console.log(\`Found \${features.length} scenes\`);

// Get COG URLs for a scene
const assets = await astra.getAssets(features[0].id, {
  bands: ['red', 'green', 'blue', 'nir'],
});`;

const curlCode = `# Search for satellite imagery
curl "https://astraos.cloud/api/v1/search?\\
  bbox=-122.5,37.5,-122.0,38.0&\\
  datetime=2025-01-01/2025-02-01&\\
  cloud_cover_lt=20&\\
  limit=10" \\
  -H "Authorization: Bearer astra_your_key"

# Get scene details
curl "https://astraos.cloud/api/v1/scenes/\\
  sentinel-2-l2a:S2A_MSIL2A_20250115T..." \\
  -H "Authorization: Bearer astra_your_key"

# Resolve asset URLs (COG)
curl "https://astraos.cloud/api/v1/assets?\\
  scene_id=sentinel-2-l2a:S2A_...&\\
  bands=red,green,blue,nir" \\
  -H "Authorization: Bearer astra_your_key"`;

export function CodeExample() {
  return (
    <section className="py-20 md:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="primary" className="mb-4">
            Developer Experience
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Integrate in{" "}
            <span className="text-primary">minutes</span>, not weeks
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A clean, consistent API that works the same way regardless of which satellite
            provider the data comes from. Get your first results in 5 lines of code.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Tabs defaultValue="python">
            <TabsList className="mb-4">
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            <TabsContent value="python">
              <CodeBlock code={pythonCode} language="python" filename="quickstart.py" showLineNumbers />
            </TabsContent>
            <TabsContent value="javascript">
              <CodeBlock code={jsCode} language="javascript" filename="quickstart.ts" showLineNumbers />
            </TabsContent>
            <TabsContent value="curl">
              <CodeBlock code={curlCode} language="bash" filename="terminal" showLineNumbers />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </section>
  );
}
