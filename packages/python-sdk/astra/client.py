from __future__ import annotations
import time
from typing import Optional
from urllib.parse import urlencode
import urllib.request
import json

from .types import (
    BBox,
    Job,
    Operation,
    ResolvedAsset,
    Scene,
    SearchParams,
    SearchResult,
)


class AstraError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(f"ASTRA API error {status}: {message}")
        self.status = status


class AstraClient:
    def __init__(self, api_key: str, base_url: str = "https://astraos.cloud"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def _request(self, path: str, method: str = "GET", body: Optional[dict] = None) -> dict:
        url = f"{self.base_url}{path}"
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(
            url,
            data=data,
            method=method,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            try:
                body_bytes = e.read()
                err = json.loads(body_bytes).get("error", e.reason)
            except Exception:
                err = e.reason
            raise AstraError(e.code, err) from None

    # ── Search ────────────────────────────────────────────────────────────────

    def search(
        self,
        bbox: BBox,
        datetime: str,
        *,
        collections: Optional[list[str]] = None,
        cloud_cover_lt: Optional[float] = None,
        limit: int = 10,
    ) -> SearchResult:
        params: dict = {
            "bbox": ",".join(str(v) for v in bbox),
            "datetime": datetime,
            "limit": limit,
        }
        if collections:
            params["collections"] = ",".join(collections)
        if cloud_cover_lt is not None:
            params["cloud_cover_lt"] = cloud_cover_lt

        raw = self._request(f"/api/v1/search?{urlencode(params)}")
        return SearchResult.from_dict(raw)

    # ── Scenes ────────────────────────────────────────────────────────────────

    def get_scene(self, scene_id: str) -> Scene:
        from urllib.parse import quote
        raw = self._request(f"/api/v1/scenes/{quote(scene_id, safe='')}")
        return Scene.from_dict(raw)

    # ── Assets ────────────────────────────────────────────────────────────────

    def get_assets(
        self, scene_id: str, *, bands: Optional[list[str]] = None
    ) -> list[ResolvedAsset]:
        params: dict = {"scene_id": scene_id}
        if bands:
            params["bands"] = ",".join(bands)
        raw = self._request(f"/api/v1/assets?{urlencode(params)}")
        return [ResolvedAsset.from_dict(a) for a in raw.get("assets", [])]

    # ── Processing ────────────────────────────────────────────────────────────

    def submit_job(
        self,
        operation: Operation,
        scene_id: str,
        *,
        bbox: Optional[BBox] = None,
        params: Optional[dict] = None,
    ) -> Job:
        body: dict = {"operation": operation, "scene_id": scene_id}
        if bbox:
            body["bbox"] = list(bbox)
        if params:
            body.update(params)
        raw = self._request("/api/v1/process", method="POST", body=body)
        return Job.from_dict(raw)

    def get_job(self, job_id: str) -> Job:
        raw = self._request(f"/api/v1/process/{job_id}")
        return Job.from_dict(raw)

    def poll_job(
        self,
        job_id: str,
        *,
        interval_s: float = 2.0,
        timeout_s: float = 120.0,
    ) -> Job:
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            job = self.get_job(job_id)
            if job.status in ("complete", "failed"):
                return job
            time.sleep(interval_s)
        raise TimeoutError(f"Job {job_id} did not complete within {timeout_s}s")


def create_client(api_key: str, *, base_url: str = "https://astraos.cloud") -> AstraClient:
    return AstraClient(api_key=api_key, base_url=base_url)
