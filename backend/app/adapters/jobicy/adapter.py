from datetime import datetime, timezone
from decimal import Decimal

import httpx

from app.adapters.base import FetchParams, JobSourceAdapter
from app.config import settings
from app.models.schemas import CanonicalJobInput, LocationSchema

JOBICY_BASE_URL = "https://jobicy.com/api/v2/remote-jobs"
MAX_COUNT = 200


class JobicyAdapter(JobSourceAdapter):
    """Jobicy remote jobs API — https://jobicy.com/jobs-rss-feed (no API key)."""

    source_name = "jobicy"

    async def fetch_jobs(self, params: FetchParams) -> list[dict]:
        if params.page > 0:
            return []

        count = min(params.limit, MAX_COUNT)
        query: dict[str, str | int] = {"count": count}
        if settings.jobicy_geo:
            query["geo"] = settings.jobicy_geo
        if settings.jobicy_tag:
            query["tag"] = settings.jobicy_tag
        if settings.jobicy_industry:
            query["industry"] = settings.jobicy_industry

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(JOBICY_BASE_URL, params=query)
            response.raise_for_status()
            data = response.json()
            return data.get("jobs", [])

    def normalize(self, raw: dict) -> CanonicalJobInput:
        job_types = raw.get("jobType") or []
        industries = raw.get("jobIndustry") or []
        geo = raw.get("jobGeo")

        return CanonicalJobInput(
            source=self.source_name,
            source_job_id=str(raw["id"]),
            title=raw.get("jobTitle", "Untitled role"),
            company_name=raw.get("companyName") or "Unknown company",
            company_uen=None,
            location=LocationSchema(
                address=geo,
                district=None,
                region=geo,
            ),
            salary_min=_to_decimal(raw.get("salaryMin")),
            salary_max=_to_decimal(raw.get("salaryMax")),
            salary_currency=raw.get("salaryCurrency"),
            salary_period=_normalize_period(raw.get("salaryPeriod")),
            employment_type=job_types[0] if job_types else None,
            seniority_level=raw.get("jobLevel"),
            skills=industries,
            description=raw.get("jobDescription"),
            posted_date=_parse_date(raw.get("pubDate")),
            expiry_date=None,
            apply_url=raw.get("url") or f"https://jobicy.com/jobs/{raw['id']}",
            raw_payload=raw,
        )


def _parse_date(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _to_decimal(value: object | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def _normalize_period(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.lower()
    if normalized == "yearly":
        return "annual"
    return normalized
