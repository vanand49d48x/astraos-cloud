import type {
  ClientOptions,
  SearchParams,
  SearchResult,
  Scene,
  AssetListParams,
  AssetListResult,
  SubmitJobParams,
  Job,
  PollOptions,
} from "./types";

function serializeJob(raw: Record<string, unknown>): Job {
  return {
    jobId: raw.job_id as string,
    status: raw.status as Job["status"],
    operation: raw.operation as Job["operation"],
    sceneId: raw.scene_id as string,
    bbox: raw.bbox as Job["bbox"],
    pollUrl: raw.poll_url as string,
    resultUrl: raw.result_url as string | undefined,
    error: raw.error as string | undefined,
    createdAt: raw.created_at as string,
    completedAt: raw.completed_at as string | undefined,
  };
}

export class AstraClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://astraos.cloud").replace(/\/$/, "");
  }

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        `ASTRA API error ${res.status}: ${(body as { error?: string }).error ?? res.statusText}`
      );
    }

    return res.json() as Promise<T>;
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  async search(params: SearchParams): Promise<SearchResult> {
    const qs = new URLSearchParams();
    qs.set("bbox", params.bbox.join(","));
    qs.set("datetime", params.datetime);
    if (params.collections?.length) qs.set("collections", params.collections.join(","));
    if (params.cloudCoverLt != null) qs.set("cloud_cover_lt", String(params.cloudCoverLt));
    if (params.limit != null) qs.set("limit", String(params.limit));

    return this.request<SearchResult>(`/api/v1/search?${qs}`);
  }

  // ── Scenes ──────────────────────────────────────────────────────────────────

  readonly scenes = {
    get: (id: string): Promise<Scene> =>
      this.request<Scene>(`/api/v1/scenes/${encodeURIComponent(id)}`),
  };

  // ── Assets ──────────────────────────────────────────────────────────────────

  readonly assets = {
    list: (params: AssetListParams): Promise<AssetListResult> => {
      const qs = new URLSearchParams({ scene_id: params.sceneId });
      if (params.bands?.length) qs.set("bands", params.bands.join(","));
      return this.request<AssetListResult>(`/api/v1/assets?${qs}`);
    },
  };

  // ── Processing ──────────────────────────────────────────────────────────────

  readonly process = {
    submit: async (params: SubmitJobParams): Promise<Job> => {
      const raw = await this.request<Record<string, unknown>>("/api/v1/process", {
        method: "POST",
        body: JSON.stringify({
          operation: params.operation,
          scene_id: params.sceneId,
          bbox: params.bbox,
          ...params.params,
        }),
      });
      return serializeJob(raw);
    },

    get: async (jobId: string): Promise<Job> => {
      const raw = await this.request<Record<string, unknown>>(`/api/v1/process/${jobId}`);
      return serializeJob(raw);
    },

    poll: async (jobId: string, options: PollOptions = {}): Promise<Job> => {
      const intervalMs = options.intervalMs ?? 2000;
      const timeoutMs = options.timeoutMs ?? 120_000;
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        const job = await this.process.get(jobId);
        if (job.status === "complete" || job.status === "failed") return job;
        await new Promise((r) => setTimeout(r, intervalMs));
      }

      throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`);
    },
  };
}

export function createClient(options: ClientOptions): AstraClient {
  return new AstraClient(options);
}
