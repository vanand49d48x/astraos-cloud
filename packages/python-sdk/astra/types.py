from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Literal, Optional

BBox = tuple[float, float, float, float]  # west, south, east, north
JobStatus = Literal["queued", "processing", "complete", "failed"]
Operation = Literal["ndvi", "change_detection", "cog_convert"]


@dataclass
class SearchParams:
    bbox: BBox
    datetime: str
    collections: Optional[list[str]] = None
    cloud_cover_lt: Optional[float] = None
    limit: int = 10


@dataclass
class SceneAsset:
    href: str
    type: Optional[str] = None
    title: Optional[str] = None
    roles: list[str] = field(default_factory=list)
    band_name: Optional[str] = None
    is_cog: bool = False
    requires_auth: bool = False

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "SceneAsset":
        return cls(
            href=d["href"],
            type=d.get("type"),
            title=d.get("title"),
            roles=d.get("roles", []),
            band_name=d.get("astra:band_name"),
            is_cog=d.get("astra:is_cog", False),
            requires_auth=d.get("astra:requires_auth", False),
        )


@dataclass
class SceneProperties:
    datetime: str
    platform: str
    provider: str
    provider_name: str
    original_id: str
    cloud_cover: Optional[float] = None
    gsd: Optional[float] = None
    instruments: list[str] = field(default_factory=list)
    raw: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "SceneProperties":
        return cls(
            datetime=d["datetime"],
            platform=d["platform"],
            provider=d["astra:provider"],
            provider_name=d["astra:provider_name"],
            original_id=d["astra:original_id"],
            cloud_cover=d.get("eo:cloud_cover"),
            gsd=d.get("gsd"),
            instruments=d.get("instruments", []),
            raw=d,
        )


@dataclass
class Scene:
    id: str
    bbox: BBox
    properties: SceneProperties
    assets: dict[str, SceneAsset]
    geometry: dict[str, Any]
    links: list[dict[str, Any]]
    collection: Optional[str] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Scene":
        return cls(
            id=d["id"],
            bbox=tuple(d["bbox"]),  # type: ignore[arg-type]
            properties=SceneProperties.from_dict(d["properties"]),
            assets={k: SceneAsset.from_dict(v) for k, v in d.get("assets", {}).items()},
            geometry=d.get("geometry", {}),
            links=d.get("links", []),
            collection=d.get("collection"),
        )


@dataclass
class SearchResult:
    features: list[Scene]
    matched: Optional[int] = None
    returned: int = 0
    warnings: list[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "SearchResult":
        ctx = d.get("context", {})
        return cls(
            features=[Scene.from_dict(f) for f in d.get("features", [])],
            matched=ctx.get("matched"),
            returned=ctx.get("returned", len(d.get("features", []))),
            warnings=d.get("warnings", []),
        )


@dataclass
class ResolvedAsset:
    band: str
    status: Literal["ready", "error"]
    url: Optional[str] = None
    type: Optional[str] = None
    is_cog: bool = False
    error: Optional[str] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ResolvedAsset":
        return cls(
            band=d["band"],
            status=d["status"],
            url=d.get("url"),
            type=d.get("type"),
            is_cog=d.get("is_cog", False),
            error=d.get("error"),
        )


@dataclass
class Job:
    job_id: str
    status: JobStatus
    operation: Operation
    scene_id: str
    poll_url: str
    bbox: Optional[BBox] = None
    result_url: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[str] = None
    completed_at: Optional[str] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "Job":
        return cls(
            job_id=d["job_id"],
            status=d["status"],
            operation=d["operation"],
            scene_id=d["scene_id"],
            poll_url=d["poll_url"],
            bbox=tuple(d["bbox"]) if d.get("bbox") else None,  # type: ignore[arg-type]
            result_url=d.get("result_url"),
            error=d.get("error"),
            created_at=d.get("created_at"),
            completed_at=d.get("completed_at"),
        )
