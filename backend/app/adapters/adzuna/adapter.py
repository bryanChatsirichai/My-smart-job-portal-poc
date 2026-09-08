import logging
from datetime import datetime, timezone
from decimal import Decimal

import httpx

from app.adapters.base import FetchParams, JobSourceAdapter
from app.config import settings
from app.models.schemas import CanonicalJobInput, LocationSchema

logger = logging.getLogger(__name__)

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs/sg/search"


class AdzunaAdapter(JobSourceAdapter):
    """Adzuna job search API — https://developer.adzuna.com (Singapore: /jobs/sg/)."""

    source_name = "adzuna"

    @staticmethod
    def is_configured() -> bool:
        return bool(settings.adzuna_app_id and settings.adzuna_app_key)

    async def fetch_jobs(self, params: FetchParams) -> list[dict]:
        if not self.is_configured():
            logger.warning("Adzuna API credentials not set; skip sync for source=adzuna")
            return []

        page = params.page + 1  # Adzuna pages are 1-based
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
        location = raw.get("location") or {}
        area = location.get("area") or []
        company = raw.get("company") or {}

        region = area[0] if area else None
        district = location.get("display_name") or (area[-1] if area else None)

        contract_time = raw.get("contract_time")
        employment_type = _format_contract_time(contract_time) or _format_contract_type(
            raw.get("contract_type")
        )

        category = raw.get("category") or {}
        skills = [category.get("label")] if category.get("label") else []

        posted_date = _parse_date(raw.get("created"))
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
            salary_min=_to_decimal(raw.get("salary_min")),
            salary_max=_to_decimal(raw.get("salary_max")),
            salary_currency="SGD",
            salary_period="annual",
            employment_type=employment_type,
            seniority_level=None,
            skills=skills,
            description=raw.get("description"),
            posted_date=posted_date,
            expiry_date=None,
            apply_url=apply_url,
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


def _format_contract_time(value: str | None) -> str | None:
    if not value:
        return None
    return value.replace("_", " ").title()


def _format_contract_type(value: str | None) -> str | None:
    if not value:
        return None
    return value.replace("_", " ").title()
