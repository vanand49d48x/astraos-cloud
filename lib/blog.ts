export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  authorAvatar: string;
  readTime: string;
  tags: string[];
  content: string;
}

const posts: BlogPost[] = [
  {
    slug: "introducing-astra-os",
    title: "Introducing ASTRA OS: The Operating System for Earth Observation Data",
    description:
      "Today we are launching ASTRA OS, a unified API platform that gives developers access to satellite imagery from Sentinel-2, Landsat, and Microsoft Planetary Computer through a single integration.",
    date: "2026-02-03",
    author: "ASTRA Team",
    authorAvatar: "/avatars/astra-team.png",
    readTime: "6 min read",
    tags: ["announcement", "product", "launch"],
    content: `Earth observation data has never been more abundant. Sentinel-2 captures the entire planet every five days. Landsat has been recording since the 1970s. Commercial providers like Planet image the globe daily at sub-meter resolution. Yet accessing this data remains frustratingly fragmented.

Every satellite provider has its own API, its own metadata schema, its own file format, and its own authentication system. If you want to search across Sentinel-2 and Landsat for the best cloud-free image of a region, you need to integrate with two separate systems, reconcile two different metadata formats, and handle two different download pipelines. Add a commercial provider and you are dealing with three.

ASTRA OS changes this. We built a single REST API that lets developers search, discover, and access satellite imagery from multiple providers through one integration. One API key. One set of docs. One response format.

## What ASTRA OS Does

At its core, ASTRA OS is a three-layer platform:

**Layer 1 — Unified Data Access.** Search across Sentinel-2, Landsat 8/9, and Microsoft Planetary Computer with a single API call. Filter by bounding box, date range, cloud cover, and spectral bands. Every result comes back in a consistent STAC-compliant metadata format, and every asset is delivered as a Cloud-Optimized GeoTIFF regardless of the upstream source format.

**Layer 2 — Data Brokerage.** (Coming soon.) Purchase commercial imagery from Planet, Maxar, Airbus, and others through ASTRA OS. One contract replaces multiple vendor relationships. Intelligent source selection finds the best available imagery for your time, location, and budget.

**Layer 3 — Analytics Primitives.** Server-side processing via API. Compute NDVI, run change detection, apply cloud masking — all without downloading raw data to your machine. Submit a job, poll for results, download the output.

## Why We Built This

We kept seeing the same pattern across teams working with satellite data. A climate tech startup spends weeks integrating Sentinel-2, then needs Landsat data and has to start over. A precision agriculture company wants to compare imagery from three providers but building the comparison pipeline takes longer than building the actual product.

The satellite data ecosystem has great raw ingredients — open data programs, cloud-optimized formats, STAC metadata standards. But the integration burden is real, and it falls on every individual developer and team.

ASTRA OS absorbs that integration complexity. We maintain the provider adapters, handle the format normalization, manage the rate limiting, and cache the metadata. Your application code just talks to one API.

## Technical Decisions

A few architectural choices that shaped the platform:

**STAC metadata everywhere.** The SpatioTemporal Asset Catalog specification is the closest thing the geospatial community has to a universal metadata standard. Every search result from ASTRA OS returns STAC-compliant metadata, even when the upstream provider does not natively support STAC.

**Cloud-Optimized GeoTIFF as the canonical output.** COG is a regular GeoTIFF with an internal tiling and overview structure that enables efficient HTTP range requests. This means clients can read just the portion of the image they need without downloading the entire file. Every asset delivered through ASTRA OS is COG, even if the source data arrives as JPEG2000 or Sentinel SAFE format.

**Provider adapter pattern.** Each satellite provider is abstracted behind a common interface. Adding a new provider means implementing one adapter — the rest of the system is unaware of the change. This is how we plan to scale from three providers to thirty.

## Getting Started

ASTRA OS is available today with a free tier of 5,000 API calls per month. No credit card required.

Sign up at astraos.cloud, grab your API key, and start searching. The documentation covers everything from authentication to advanced processing jobs.

We are building ASTRA OS for the developers and teams who are solving real problems with satellite data — monitoring deforestation, tracking urban growth, optimizing crop yields, assessing climate risk. If that is you, we would love to hear what you are building.`,
  },
  {
    slug: "why-cloud-optimized-geotiff-matters",
    title: "Why Cloud-Optimized GeoTIFF (COG) Matters for Satellite Data",
    description:
      "A technical deep dive into the Cloud-Optimized GeoTIFF format: how it works, why it is the best delivery format for satellite imagery, and how ASTRA OS uses it to normalize output across providers.",
    date: "2026-01-27",
    author: "ASTRA Team",
    authorAvatar: "/avatars/astra-team.png",
    readTime: "8 min read",
    tags: ["engineering", "geotiff", "satellite-data"],
    content: `If you work with satellite imagery, you have probably encountered a range of file formats: JPEG2000 from Sentinel-2, GeoTIFF from Landsat, HDF5 from MODIS, NetCDF from climate models, and proprietary formats from commercial providers. This format fragmentation creates real problems for developers building applications on top of satellite data.

Cloud-Optimized GeoTIFF (COG) solves most of these problems. It has become the de facto standard for serving satellite imagery in cloud-native workflows, and it is the canonical output format for every asset delivered through ASTRA OS. Here is why.

## What Makes a GeoTIFF "Cloud-Optimized"

A COG is a regular GeoTIFF file with two specific internal organization requirements:

**1. Internal tiling.** Instead of storing the image as sequential scanlines (row by row, top to bottom), a COG stores the image as a grid of tiles — typically 256x256 or 512x512 pixels. Each tile is independently compressed and can be read without decompressing any other tile.

**2. Overview pyramids.** A COG embeds reduced-resolution versions of the image (overviews) inside the same file. A typical overview chain might include the image at 1/2, 1/4, 1/8, and 1/16 of the original resolution. These overviews are also internally tiled.

The combination of tiling and overviews enables a critical capability: HTTP range requests. Because the file has a predictable internal layout, a client can calculate exactly which byte ranges correspond to a specific geographic region at a specific zoom level, then fetch only those bytes using HTTP Range headers.

## Why This Matters in Practice

Consider a Sentinel-2 tile. A single band at full resolution is roughly 110 megapixels (10,980 x 10,980 pixels at 10m resolution). As an uncompressed GeoTIFF, that is about 220 MB per band. A complete Sentinel-2 scene with all 13 bands can exceed 1 GB.

Without COG, if you want to analyze a 5 km x 5 km area of interest within that tile, you have two options: download the entire file and crop locally, or rely on a server-side processing service to extract the region for you.

With COG, the client reads the file header to understand the tiling layout, calculates which tiles intersect the area of interest, and fetches only those tiles via HTTP range requests. For a 5 km x 5 km region within a 110 km x 110 km tile, you might download less than 1% of the total file.

This is not theoretical. The difference between downloading 220 MB and 2 MB is the difference between a 30-second wait and a sub-second response. For applications that need to display or analyze many scenes — time series analysis, change detection, mosaicking — the efficiency gains compound.

## How ASTRA OS Uses COG

Every asset delivered through the ASTRA OS API is a Cloud-Optimized GeoTIFF, regardless of the upstream source format. This normalization happens at the provider adapter layer:

**Sentinel-2** natively stores data as JPEG2000 (.jp2) files within a SAFE directory structure. When you request a Sentinel-2 asset through ASTRA OS, we transcode the JPEG2000 data to COG with internal 512x512 tiling and Deflate compression.

**Landsat** data from USGS is already delivered as GeoTIFF, but not always cloud-optimized. We validate the internal structure and re-tile if necessary to ensure consistent COG compliance.

**Planetary Computer** assets are typically already COG-formatted, as Microsoft has invested heavily in cloud-native geospatial infrastructure. In these cases, ASTRA OS proxies the asset directly.

The result is that your application code never needs to handle format-specific logic. Whether the original data was JPEG2000, non-optimized GeoTIFF, or something else, what you receive is always a well-formed COG.

## COG vs. Other Formats

**JPEG2000.** Used by Sentinel-2 because of its excellent compression ratios. However, JPEG2000 has poor support for HTTP range requests (the wavelet-based compression makes it difficult to access arbitrary regions without decoding significant portions of the file). Decoding is also CPU-intensive and library support is inconsistent across platforms.

**Zarr / Cloud-Optimized NetCDF.** Excellent for multidimensional array data (time series, climate models). Not ideal for single-scene satellite imagery where the GeoTIFF ecosystem (GDAL, rasterio, QGIS) provides better tooling support.

**STAC + COG together.** STAC provides the metadata catalog (where is the data, what does it cover, what are its properties) and COG provides the efficient data access. This combination is the foundation of modern cloud-native geospatial infrastructure, and it is exactly what ASTRA OS delivers.

## Reading COGs in Practice

Most geospatial libraries support COG access transparently. With GDAL or rasterio, you can open a COG directly from an HTTP URL:

\`\`\`python
import rasterio

url = "https://astraos.cloud/api/v1/assets/scene-id/B04?format=cog"
with rasterio.open(url) as src:
    # Read a window — only fetches the tiles that intersect
    window = rasterio.windows.from_bounds(
        left, bottom, right, top,
        transform=src.transform
    )
    data = src.read(1, window=window)
\`\`\`

This code only downloads the tiles that intersect your bounding box, not the entire file. The HTTP range request negotiation happens transparently inside GDAL.

## The Bottom Line

COG is not just a file format — it is an infrastructure pattern. It moves the cost of data access from "download everything, then process" to "fetch only what you need, when you need it." For satellite data applications where scenes are large and areas of interest are often small, this pattern reduces bandwidth, latency, and storage costs by one to two orders of magnitude.

That is why we chose COG as the canonical output format for ASTRA OS, and why we invest in making sure every asset we deliver is properly optimized.`,
  },
  {
    slug: "unified-search-across-satellite-providers",
    title: "Unified Search Across Satellite Providers: How We Built It",
    description:
      "An architecture deep dive into how ASTRA OS searches across Sentinel-2, Landsat, and Planetary Computer simultaneously, normalizes metadata into a consistent schema, and returns merged results in a single response.",
    date: "2026-01-20",
    author: "ASTRA Team",
    authorAvatar: "/avatars/astra-team.png",
    readTime: "10 min read",
    tags: ["engineering", "architecture", "search"],
    content: `One of the core promises of ASTRA OS is that you can search across multiple satellite data providers with a single API call. A request to \`/api/v1/search\` with a bounding box, date range, and cloud cover filter returns results from Sentinel-2, Landsat, and Microsoft Planetary Computer — merged, deduplicated, and sorted — in one response.

This sounds simple, but the implementation required solving several non-trivial problems. This post walks through the architecture.

## The Problem

Each satellite data provider exposes search differently:

**Sentinel-2 (Copernicus Data Space).** STAC API with OGC-compliant filtering. Metadata includes properties like \`eo:cloud_cover\`, \`s2:thin_cirrus_percentage\`, and Sentinel-specific processing levels. Spatial search uses GeoJSON geometry intersection.

**Landsat (USGS).** Also STAC-compliant, but with different property names (\`eo:cloud_cover\` exists, but ancillary properties differ). Scene IDs follow the Landsat naming convention (e.g., \`LC08_L2SP_044034_20250115_...\`). Band naming differs from Sentinel-2.

**Microsoft Planetary Computer.** A STAC API that aggregates multiple collections, including Sentinel-2 L2A, Landsat Collection 2, and additional datasets like NAIP and Copernicus DEM. Requires a SAS token for asset access.

If you are building an application and you want the best available cloud-free imagery over San Francisco from the last month, you need to query all three, understand each response schema, handle pagination differently for each, and merge the results yourself.

## The Provider Adapter Pattern

ASTRA OS uses a provider adapter pattern where each satellite data source is wrapped in a class that implements a common interface:

\`\`\`typescript
interface SatelliteProvider {
  id: string;
  name: string;
  search(params: SearchParams): Promise<STACFeatureCollection>;
  getScene(sceneId: string): Promise<STACFeature>;
  getAssetUrl(sceneId: string, band: string): Promise<string>;
}
\`\`\`

Each adapter is responsible for translating the common search parameters into the provider-specific API format and translating the provider-specific response back into a normalized STAC feature.

For example, the Sentinel-2 adapter translates our \`cloud_cover_lt: 20\` parameter into the Copernicus Data Space filter syntax, makes the HTTP request, and maps the response properties to our canonical schema. The Landsat adapter does the same for the USGS STAC API.

## Concurrent Search with Controlled Fan-Out

When a search request arrives, the orchestrator fans out to all enabled providers concurrently:

\`\`\`typescript
async function search(params: SearchParams): Promise<MergedResults> {
  const providers = registry.getEnabledProviders();

  const results = await Promise.allSettled(
    providers.map(provider =>
      withTimeout(provider.search(params), PROVIDER_TIMEOUT_MS)
    )
  );

  return mergeResults(results, params);
}
\`\`\`

We use \`Promise.allSettled\` rather than \`Promise.all\` deliberately. If one provider is slow or temporarily unavailable, the others still return results. The response includes a \`providers\` field indicating which providers contributed results and whether any timed out.

Each provider call has a timeout (currently 10 seconds). If Sentinel-2's API is having a slow day, Landsat and Planetary Computer results still come back quickly. The response metadata tells the caller exactly what happened.

## Metadata Normalization

The hardest part of unified search is not making the API calls — it is making the results comparable. Different providers describe the same information differently.

Our normalization layer maps provider-specific metadata to a canonical schema:

**Cloud cover** is straightforward — most providers report \`eo:cloud_cover\` as a percentage. But Sentinel-2 also reports \`s2:thin_cirrus_percentage\` and \`s2:cloud_shadow_percentage\` which do not have Landsat equivalents. We expose the canonical \`cloud_cover\` field on all results and include provider-specific extensions in a \`properties.provider_properties\` object.

**Band mapping** is more complex. Sentinel-2 Band 4 (Red, 10m) and Landsat Band 4 (Red, 30m) are spectrally similar but not identical. We maintain a band equivalence table that maps common band names (red, green, blue, nir, swir1, swir2) to provider-specific band identifiers. When you request the "red" band through the ASTRA OS assets endpoint, the adapter knows to fetch B04 from Sentinel-2 or B4 from Landsat.

**Spatial footprints** are normalized to GeoJSON polygons in EPSG:4326. Sentinel-2 tiles are fixed grid squares. Landsat scenes follow the WRS-2 path/row system with parallelogram-shaped footprints. We store both the original footprint and a simplified bounding box for fast spatial filtering.

## Caching and Performance

Satellite metadata does not change after initial publication (with rare exceptions for reprocessing campaigns). This makes it highly cacheable.

ASTRA OS uses a two-tier caching strategy:

**Tier 1: Postgres metadata cache.** When we fetch scene metadata from a provider, we store the normalized STAC feature in Postgres with a PostGIS spatial index. Subsequent searches that match cached scenes can be served from the database without hitting the upstream API. The cache TTL is 24 hours for search results and 7 days for individual scene metadata.

**Tier 2: In-memory request cache.** Identical search requests within a short window (60 seconds) are served from an in-memory LRU cache. This handles the common pattern of a frontend making the same search request multiple times during user interaction.

Cache hit rates in practice are high. Most satellite data consumers search the same geographic regions repeatedly — a farm monitoring service checks the same fields, a forestry application monitors the same concessions. After the first search, subsequent queries for the same area largely hit the cache.

## Deduplication

Microsoft Planetary Computer includes both Sentinel-2 and Landsat data. If we query Planetary Computer alongside the native Sentinel-2 and Landsat APIs, we get duplicate results.

We handle this with a deduplication step in the merge phase. Each scene is assigned a canonical identifier based on its source mission and acquisition parameters. For Sentinel-2, this is the tile ID and acquisition timestamp. For Landsat, it is the WRS-2 path/row and acquisition date.

When duplicates are detected, we prefer the result from the native provider API (Copernicus for Sentinel-2, USGS for Landsat) because the metadata is typically more complete. The Planetary Computer result is discarded, but its asset URLs are stored as fallback access paths.

## Rate Limiting and Backpressure

Upstream providers have rate limits. Copernicus Data Space allows a limited number of concurrent requests per API key. USGS has similar constraints.

ASTRA OS implements per-provider rate limiting with a token bucket algorithm. Each provider has a configured maximum concurrent request count and a request-per-second ceiling. When a burst of user searches hits the platform, the rate limiter queues excess requests and drains them at a sustainable pace.

We also implement backpressure signaling. If a provider starts responding slowly (latency above 2x the normal p50), we reduce concurrency to that provider. This prevents a struggling upstream service from consuming all our connection pool resources.

## What We Learned

Building unified search taught us a few things:

**Partial results are better than no results.** Early versions waited for all providers before responding. We switched to returning whatever is available within the timeout window. Users overwhelmingly prefer fast, partial results with a "Provider X timed out" notice over waiting 30 seconds for a complete response.

**Metadata normalization is a spectrum.** Perfect normalization is impossible — the providers genuinely measure different things. Our approach is to normalize the common fields (cloud cover, footprint, datetime, bands) and preserve provider-specific fields under a namespace. This gives applications a consistent baseline without losing information.

**Caching changes the economics.** Without caching, every user search requires multiple upstream API calls. With the Postgres metadata cache, the vast majority of searches are served locally. This reduces upstream load, reduces latency, and means we are not blocked when a provider has a maintenance window.

The unified search is the foundation that everything else in ASTRA OS builds on. The data brokerage layer will extend the same adapter pattern to commercial providers. The analytics layer uses the same scene identifiers and band mapping. Getting the search architecture right was the most important technical decision we made.`,
  },
];

export function getAllPosts(): BlogPost[] {
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

export function getPostsByTag(tag: string): BlogPost[] {
  return posts
    .filter((post) => post.tags.includes(tag))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}
