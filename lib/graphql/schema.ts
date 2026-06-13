export const typeDefs = /* GraphQL */ `
  """
  ASTRA OS GraphQL API — unified satellite imagery search, analytics, and account info.
  Authenticate with: Authorization: Bearer astra_<key>
  """

  type Query {
    """Search satellite imagery across all providers."""
    search(
      """Bounding box [west, south, east, north]"""
      bbox: [Float!]!
      """ISO 8601 interval e.g. '2024-06-01/2024-12-31'"""
      datetime: String!
      """Filter to specific collections e.g. ['sentinel-2-l2a']"""
      collections: [String]
      """Only return scenes with cloud cover below this %"""
      cloudCoverLt: Float
      """Max number of results (default 10, max 100)"""
      limit: Int
    ): SearchResult!

    """Get a specific scene by its ASTRA scene ID."""
    scene(id: String!): STACItem

    """
    Compute spectral indices for a scene or the best scene in a bbox.
    Supported indices: ndvi, evi, ndwi, ndsi, nbr
    """
    analyze(
      """ASTRA scene ID e.g. 'planetary-computer:S2A_MSIL2A_...'"""
      sceneId: String
      """Alternative: search bbox instead of specific scene"""
      bbox: [Float]
      """Required when using bbox"""
      datetime: String
      """Max cloud cover when searching by bbox"""
      cloudCoverLt: Float
      """Which indices to compute (default: all)"""
      indices: [IndexName]
    ): AnalyticsResult

    """Current team account info, plan, and quota."""
    me: AccountInfo
  }

  # ── Search ────────────────────────────────────────────────────────────────

  type SearchResult {
    features: [STACItem!]!
    context: SearchContext
    warnings: [String]
  }

  type SearchContext {
    matched: Int
    returned: Int
  }

  type STACItem {
    """ASTRA-prefixed scene ID e.g. 'planetary-computer:S2A_...'"""
    id: String!
    datetime: String
    cloudCover: Float
    platform: String
    """Provider display name"""
    providerName: String
    """Ground sample distance in metres"""
    gsd: Float
    """[west, south, east, north]"""
    bbox: [Float]
    """URL of a preview thumbnail image"""
    thumbnailUrl: String
    assets: [Asset]
    collection: String
  }

  type Asset {
    key: String!
    href: String!
    """MIME type"""
    type: String
    title: String
  }

  # ── Analytics ─────────────────────────────────────────────────────────────

  enum IndexName {
    ndvi
    evi
    ndwi
    ndsi
    nbr
  }

  type AnalyticsResult {
    sceneId: String!
    datetime: String!
    provider: String!
    cloudCover: Float
    bbox: [Float]
    indices: ComputedIndices!
    bandsUsed: [String!]!
  }

  type ComputedIndices {
    ndvi: IndexValue
    evi: IndexValue
    ndwi: IndexValue
    ndsi: IndexValue
    nbr: IndexValue
  }

  type IndexValue {
    """Scalar index value derived from band means"""
    value: Float!
    min: Float
    max: Float
    std: Float
    """Human-readable description e.g. 'Moderate vegetation / cropland'"""
    interpretation: String!
    """Machine-readable category slug"""
    category: String!
    """What this index measures"""
    description: String!
  }

  # ── Account ───────────────────────────────────────────────────────────────

  type AccountInfo {
    plan: String!
    """Total API calls in the current billing period"""
    totalCalls: Int!
    """Monthly call limit for this plan"""
    callLimit: Int!
    """Percentage of quota used (0-100)"""
    quotaUsedPct: Float!
  }
`;
