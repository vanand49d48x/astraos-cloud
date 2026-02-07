export const SITE = {
  name: "ASTRA OS",
  tagline: "The Operating System for Earth Observation Data",
  description:
    "ASTRA OS unifies satellite imagery from multiple providers into a single, developer-friendly API. One search, one format, one invoice.",
  url: "https://astraos.cloud",
  ogImage: "/og-image.png",
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Blog", href: "/blog" },
] as const;

export const PRICING_TIERS = [
  {
    name: "Free",
    price: 0,
    priceLabel: "$0",
    period: "forever",
    description: "For experimentation and learning",
    apiCalls: 5_000,
    features: [
      "5,000 API calls / month",
      "Open data only (Sentinel, Landsat)",
      "COG + STAC output",
      "Community support",
      "1 API key",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Starter",
    price: 500,
    priceLabel: "$500",
    period: "/mo",
    description: "For small teams building on satellite data",
    apiCalls: 25_000,
    features: [
      "25,000 API calls / month",
      "Open data + basic analytics",
      "NDVI, change detection primitives",
      "Email support",
      "5 API keys",
      "Usage dashboard",
    ],
    cta: "Start Building",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 2_000,
    priceLabel: "$2,000",
    period: "/mo",
    description: "For teams that need commercial data and advanced analytics",
    apiCalls: 100_000,
    features: [
      "100,000 API calls / month",
      "Commercial data (pass-through + 20%)",
      "Advanced analytics primitives",
      "Priority support",
      "Unlimited API keys",
      "Team management",
      "Custom processing jobs",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: null,
    priceLabel: "Custom",
    period: "",
    description: "For organizations with custom requirements",
    apiCalls: null,
    features: [
      "Unlimited API calls",
      "Dedicated support + SLA",
      "Custom integrations",
      "On-premise deployment option",
      "Volume discounts on commercial data",
      "SOC 2 compliance",
      "Custom model hosting",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
] as const;

export const DATA_SOURCES = [
  {
    id: "sentinel-2-l2a",
    name: "Sentinel-2",
    provider: "Copernicus / ESA",
    resolution: "10m",
    revisit: "5 days",
    type: "Optical",
    status: "live" as const,
  },
  {
    id: "landsat-c2-l2",
    name: "Landsat 8/9",
    provider: "USGS / NASA",
    resolution: "30m",
    revisit: "8 days",
    type: "Optical",
    status: "live" as const,
  },
  {
    id: "planetary-computer",
    name: "Planetary Computer",
    provider: "Microsoft",
    resolution: "Various",
    revisit: "Various",
    type: "Multi-source",
    status: "live" as const,
  },
  {
    id: "planet",
    name: "Planet",
    provider: "Planet Labs",
    resolution: "3m",
    revisit: "Daily",
    type: "Optical",
    status: "coming" as const,
  },
  {
    id: "maxar",
    name: "Maxar",
    provider: "Maxar Technologies",
    resolution: "30cm",
    revisit: "Variable",
    type: "Optical",
    status: "coming" as const,
  },
  {
    id: "capella",
    name: "Capella Space",
    provider: "Capella",
    resolution: "50cm",
    revisit: "Variable",
    type: "SAR",
    status: "coming" as const,
  },
] as const;

export const PAIN_POINTS = [
  {
    title: "Format Fragmentation",
    problem: "Sentinel uses SAFE, Planet delivers GeoTIFF, Maxar uses NITF, SAR data comes in complex phase formats.",
    solution: "We standardize everything to COG + STAC",
    icon: "FileWarning",
  },
  {
    title: "Resolution Mismatch",
    problem: "Sentinel-2 at 10m, Planet at 3m, Maxar at 30cm. Fusing these requires significant preprocessing.",
    solution: "Common grid with scale= and resampling= params",
    icon: "Grid3x3",
  },
  {
    title: "Procurement Complexity",
    problem: "Managing separate contracts, billing systems, and SLAs with each provider.",
    solution: "One API key, one invoice",
    icon: "Receipt",
  },
  {
    title: "Processing Overhead",
    problem: "Cloud masking, atmospheric correction, and co-registration consume 40-60% of engineering time.",
    solution: "Callable primitives: ndvi(), change_detection()",
    icon: "Cpu",
  },
  {
    title: "No Unified Search",
    problem: "No single interface to discover what imagery exists across all providers.",
    solution: "One search across all providers",
    icon: "SearchX",
  },
] as const;

export const USE_CASES = [
  {
    title: "Climate Tech Startup",
    problem: "Can't unify Sentinel + Landsat quickly. Engineers spend weeks writing custom ETL pipelines for each provider.",
    solution: "One search \u2192 one API \u2192 done. Query both providers with a single request, get normalized COG output.",
    value: "Days of integration become one afternoon.",
    icon: "Leaf",
  },
  {
    title: "Agricultural Analytics",
    problem: "Need frequent optical imagery + historical data for crop monitoring and yield prediction.",
    solution: "Sentinel-2 for current 5-day revisit + Landsat archive for 40-year trend analysis. Unified time series through one API.",
    value: "Seamless multi-source time series without data engineering.",
    icon: "Wheat",
  },
  {
    title: "Insurance / Risk Assessment",
    problem: "Fragmented data access, manual discovery across providers. Slow underwriting analysis.",
    solution: "Centralized catalog + consistent metadata. Search any AOI, get all available imagery ranked by relevance.",
    value: "Faster underwriting with automated imagery discovery.",
    icon: "Shield",
  },
] as const;

export const PRESET_LOCATIONS = [
  { name: "San Francisco", bbox: [-122.52, 37.7, -122.35, 37.82] as [number, number, number, number] },
  { name: "Amazon Rainforest", bbox: [-62.0, -4.0, -60.0, -2.0] as [number, number, number, number] },
  { name: "Sahara Desert", bbox: [0.0, 22.0, 2.0, 24.0] as [number, number, number, number] },
  { name: "Tokyo", bbox: [139.6, 35.55, 139.85, 35.8] as [number, number, number, number] },
  { name: "Great Barrier Reef", bbox: [145.0, -18.5, 147.0, -16.5] as [number, number, number, number] },
] as const;

export const EVENT_PRESETS = [
  {
    name: "LA Wildfires 2025",
    bbox: [-118.8, 33.9, -118.1, 34.3] as [number, number, number, number],
    datetime: "2025-01-07/2025-01-31",
    icon: "Flame",
    description: "Palisades & Eaton fires, Los Angeles",
  },
  {
    name: "Hurricane Helene 2024",
    bbox: [-84.5, 28.0, -82.0, 30.5] as [number, number, number, number],
    datetime: "2024-09-25/2024-10-10",
    icon: "CloudRain",
    description: "Category 4 hurricane, Florida / Southeast US",
  },
  {
    name: "Iceland Eruption 2024",
    bbox: [-22.5, 63.8, -22.2, 64.0] as [number, number, number, number],
    datetime: "2024-03-16/2024-04-15",
    icon: "Mountain",
    description: "Reykjanes Peninsula volcanic eruption",
  },
  {
    name: "Amazon Deforestation 2024",
    bbox: [-56.0, -6.0, -54.0, -4.0] as [number, number, number, number],
    datetime: "2024-06-01/2024-09-30",
    icon: "TreePine",
    description: "Dry season deforestation monitoring",
  },
] as const;
