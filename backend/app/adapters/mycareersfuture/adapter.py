"""MyCareersFuture Singapore government jobs adapter.

API docs: https://api.mycareersfuture.gov.sg/v2/docs
Endpoint: ``GET /v2/jobs``

Public API with standard 0-based pagination via ``limit`` and ``page``.
No authentication required. Provides the richest local metadata (UEN,
structured address, official expiry dates).
"""

import httpx

from app.adapters.base import FetchParams, JobSourceAdapter
from app.adapters.utils import normalize_salary_period, parse_datetime, to_decimal
from app.models.schemas import CanonicalJobInput, LocationSchema

MCF_BASE_URL = "https://api.mycareersfuture.gov.sg/v2/jobs"


class MyCareersFutureAdapter(JobSourceAdapter):
    """Fetches job listings from Singapore's MyCareersFuture portal API."""

    source_name = "mycareersfuture"

    async def fetch_jobs(self, params: FetchParams) -> list[dict]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                MCF_BASE_URL,
                params={"limit": params.limit, "page": params.page},
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    def normalize(self, raw: dict) -> CanonicalJobInput:
        """Map a MyCareersFuture job record to ``CanonicalJobInput``."""
        # ``postedCompany`` is the listing entity; ``hiringCompany`` may differ for agencies.
        company = raw.get("postedCompany") or raw.get("hiringCompany") or {}
        address = raw.get("address") or {}
        districts = address.get("districts") or []
        district = districts[0].get("location") if districts else None
        region = districts[0].get("region") if districts else None

        street_parts = [
            address.get("block"),
            address.get("street"),
            address.get("building"),
            address.get("postalCode"),
        ]
        address_text = " ".join(part for part in street_parts if part)

        salary = raw.get("salary") or {}
        salary_type = (salary.get("type") or {}).get("salaryType")
        metadata = raw.get("metadata") or {}
        employment_types = raw.get("employmentTypes") or []
        position_levels = raw.get("positionLevels") or []
        skills = [skill.get("skill") for skill in raw.get("skills") or [] if skill.get("skill")]

        # Prefer the latest repost date when a listing is refreshed.
        posted_date = parse_datetime(metadata.get("newPostingDate") or metadata.get("originalPostingDate"))
        expiry_date = parse_datetime(metadata.get("expiryDate"))

        return CanonicalJobInput(
            source=self.source_name,
            source_job_id=raw["uuid"],
            title=raw.get("title", "Untitled role"),
            company_name=company.get("name") or "Unknown company",
            company_uen=company.get("uen"),
            location=LocationSchema(
                address=address_text or None,
                district=district,
                region=region,
            ),
            salary_min=to_decimal(salary.get("minimum")),
            salary_max=to_decimal(salary.get("maximum")),
            salary_currency="SGD",
            salary_period=normalize_salary_period(salary_type),
            employment_type=employment_types[0].get("employmentType") if employment_types else None,
            seniority_level=position_levels[0].get("position") if position_levels else None,
            skills=skills,
            description=raw.get("description"),
            posted_date=posted_date,
            expiry_date=expiry_date,
            apply_url=metadata.get("jobDetailsUrl")
            or f"https://www.mycareersfuture.gov.sg/job/{raw['uuid']}",
            raw_payload=raw,
        )
