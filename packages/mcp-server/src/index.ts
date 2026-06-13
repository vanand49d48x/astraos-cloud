#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@astra/sdk";

const BASE_URL = process.env.ASTRA_BASE_URL ?? "https://astraos.cloud";
const API_KEY = process.env.ASTRA_API_KEY ?? "";

const astra = createClient({ apiKey: API_KEY, baseUrl: BASE_URL });

const server = new Server(
  { name: "astra-os-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ──────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_scenes",
      description:
        "Search for satellite imagery across all ASTRA OS providers (Sentinel-2, Landsat, Planetary Computer). Returns matching scenes with metadata.",
      inputSchema: {
        type: "object",
        properties: {
          bbox: {
            type: "array",
            items: { type: "number" },
            minItems: 4,
            maxItems: 4,
            description: "Bounding box [west, south, east, north] in WGS84 degrees",
          },
          datetime: {
            type: "string",
            description: 'ISO 8601 date interval e.g. "2025-01-01/2025-06-01"',
          },
          cloud_cover_lt: {
            type: "number",
            description: "Maximum cloud cover percentage (0–100)",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default 10, max 100)",
          },
          collections: {
            type: "array",
            items: { type: "string" },
            description:
              'Filter to specific collections: "sentinel-2-l2a", "landsat-c2-l2", "planetary-computer"',
          },
        },
        required: ["bbox", "datetime"],
      },
    },
    {
      name: "get_scene",
      description:
        "Get detailed metadata for a specific satellite scene, including all available spectral bands and their download URLs.",
      inputSchema: {
        type: "object",
        properties: {
          scene_id: {
            type: "string",
            description:
              'ASTRA scene ID in format "provider-id:original-scene-id" e.g. "sentinel-2-l2a:S2A_MSIL2A_..."',
          },
        },
        required: ["scene_id"],
      },
    },
    {
      name: "get_assets",
      description:
        "Resolve download URLs for specific spectral bands of a scene. Returns direct COG (Cloud-Optimized GeoTIFF) URLs ready for download or streaming.",
      inputSchema: {
        type: "object",
        properties: {
          scene_id: {
            type: "string",
            description: "ASTRA scene ID",
          },
          bands: {
            type: "array",
            items: { type: "string" },
            description:
              'Specific bands to resolve e.g. ["red", "nir", "green"]. Omit for all bands.',
          },
        },
        required: ["scene_id"],
      },
    },
    {
      name: "submit_job",
      description:
        "Submit an async processing job. Supported operations: ndvi (vegetation health index), change_detection (compare two dates), cog_convert (convert to Cloud-Optimized GeoTIFF). Returns a job ID for polling.",
      inputSchema: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            enum: ["ndvi", "change_detection", "cog_convert"],
            description: "Processing operation to run",
          },
          scene_id: {
            type: "string",
            description: "ASTRA scene ID to process",
          },
          bbox: {
            type: "array",
            items: { type: "number" },
            minItems: 4,
            maxItems: 4,
            description: "Optional crop bounding box [west, south, east, north]",
          },
        },
        required: ["operation", "scene_id"],
      },
    },
    {
      name: "get_job",
      description:
        "Check the status of a processing job. Returns status (queued/processing/complete/failed) and result URL when complete.",
      inputSchema: {
        type: "object",
        properties: {
          job_id: {
            type: "string",
            description: "Job ID returned by submit_job",
          },
        },
        required: ["job_id"],
      },
    },
  ],
}));

// ── Tool handlers ─────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!API_KEY) {
    return {
      content: [
        {
          type: "text",
          text: "Error: ASTRA_API_KEY environment variable is not set. Set it with your API key from https://astraos.cloud/dashboard/api-keys",
        },
      ],
    };
  }

  const args = request.params.arguments as Record<string, unknown>;

  try {
    switch (request.params.name) {
      case "search_scenes": {
        const result = await astra.search({
          bbox: args.bbox as [number, number, number, number],
          datetime: args.datetime as string,
          cloudCoverLt: args.cloud_cover_lt as number | undefined,
          limit: args.limit as number | undefined,
          collections: args.collections as string[] | undefined,
        });

        const summary = result.features.map((f) => ({
          id: f.id,
          provider: f.properties["astra:provider_name"],
          datetime: f.properties.datetime,
          cloud_cover: f.properties["eo:cloud_cover"],
          platform: f.properties.platform,
          gsd_meters: f.properties.gsd,
          bbox: f.bbox,
          bands: Object.keys(f.assets),
        }));

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.features.length} scenes.\n\n${JSON.stringify(summary, null, 2)}`,
            },
          ],
        };
      }

      case "get_scene": {
        const scene = await astra.scenes.get(args.scene_id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  id: scene.id,
                  provider: scene.properties["astra:provider_name"],
                  datetime: scene.properties.datetime,
                  cloud_cover: scene.properties["eo:cloud_cover"],
                  platform: scene.properties.platform,
                  gsd_meters: scene.properties.gsd,
                  bbox: scene.bbox,
                  available_bands: Object.entries(scene.assets).map(([band, asset]) => ({
                    band,
                    title: asset.title,
                    type: asset.type,
                    is_cog: asset["astra:is_cog"],
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_assets": {
        const result = await astra.assets.list({
          sceneId: args.scene_id as string,
          bands: args.bands as string[] | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.assets, null, 2),
            },
          ],
        };
      }

      case "submit_job": {
        const job = await astra.process.submit({
          operation: args.operation as "ndvi" | "change_detection" | "cog_convert",
          sceneId: args.scene_id as string,
          bbox: args.bbox as [number, number, number, number] | undefined,
        });
        return {
          content: [
            {
              type: "text",
              text: `Job submitted.\nJob ID: ${job.jobId}\nStatus: ${job.status}\nPoll with: get_job { job_id: "${job.jobId}" }`,
            },
          ],
        };
      }

      case "get_job": {
        const job = await astra.process.get(args.job_id as string);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(job, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server error:", err);
  process.exit(1);
});
