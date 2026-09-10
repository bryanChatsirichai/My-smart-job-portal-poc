"""Adzuna job search adapter (Singapore).

API docs: https://developer.adzuna.com
Endpoint: ``GET /v1/api/jobs/sg/search/{page}``

Requires ``ADZUNA_APP_ID`` and ``ADZUNA_APP_KEY``. Pages are 1-based on the
Adzuna side; this adapter accepts 0-based ``FetchParams.page`` and translates.
"""

import logging

import httpx

from app.adapters.base import FetchParams, JobSourceAdapter
from app.adapters.utils import parse_datetime, title_case_snake, to_decimal
from app.config import settings
from app.models.schemas import CanonicalJobInput, LocationSchema

logger = logging.getLogger(__name__)

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs/sg/search"


class AdzunaAdapter(JobSourceAdapter):
    """Fetches Singapore listings from the Adzuna Job Search API."""

    source_name = "adzuna"

    @staticmethod
    def is_configured() -> bool:
        """Return True when the adapter is enabled and API credentials are set."""
        return settings.adzuna_enabled and bool(settings.adzuna_app_id and settings.adzuna_app_key)

    async def fetch_jobs(self, params: FetchParams) -> list[dict]:
        if not self.is_configured():
            logger.warning("Adzuna API credentials not set; skip sync for source=adzuna")
            return []

        # Adzuna page numbers start at 1; sync worker passes 0-based indices.
        page = params.page + 1
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                f"{ADZUNA_BASE_URL}/{page}",
                params={
                    "app_id": settings.adzuna_app_id,
                    "app_key": settings.adzuna_app_key,
                    "results_per_page": params.limit,
                    "content-type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    def normalize(self, raw: dict) -> CanonicalJobInput:
        """Map an Adzuna search result object to ``CanonicalJobInput``."""
        location = raw.get("location") or {}
        area = location.get("area") or []
        company = raw.get("company") or {}

        # ``area`` is a hierarchy (country → region → city); use first/last for region/district.
        region = area[0] if area else None
        district = location.get("display_name") or (area[-1] if area else None)

        # Prefer contract_time (full_time, part_time); fall back to contract_type (permanent, contract).
        employment_type = title_case_snake(raw.get("contract_time")) or title_case_snake(
            raw.get("contract_type")
        )

        category = raw.get("category") or {}
        skills = [category.get("label")] if category.get("label") else []

        apply_url = raw.get("redirect_url") or f"https://www.adzuna.sg/details/{raw.get('id')}"

        return CanonicalJobInput(
            source=self.source_name,
            source_job_id=str(raw["id"]),
            title=raw.get("title", "Untitled role"),
            company_name=company.get("display_name") or "Unknown company",
            company_uen=None,
            location=LocationSchema(
                address=location.get("display_name"),
                district=district,
                region=region,
                lat=raw.get("latitude"),
                lng=raw.get("longitude"),
            ),
            salary_min=to_decimal(raw.get("salary_min")),
            salary_max=to_decimal(raw.get("salary_max")),
            salary_currency="SGD",
            salary_period="annual",
            employment_type=employment_type,
            seniority_level=None,
            skills=skills,
            description=raw.get("description"),
            posted_date=parse_datetime(raw.get("created")),
            expiry_date=None,
            apply_url=apply_url,
            raw_payload=raw,
        )
