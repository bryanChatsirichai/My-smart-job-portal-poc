from datetime import datetime, timezone
from decimal import Decimal

import httpx

from app.adapters.base import FetchParams, JobSourceAdapter
from app.config import settings
from app.models.schemas import CanonicalJobInput, LocationSchema

MCF_BASE_URL = "https://api.mycareersfuture.gov.sg/v2/jobs"


class MyCareersFutureAdapter(JobSourceAdapter):
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

        posted_date = _parse_date(metadata.get("newPostingDate") or metadata.get("originalPostingDate"))
        expiry_date = _parse_date(metadata.get("expiryDate"))

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
            salary_min=_to_decimal(salary.get("minimum")),
            salary_max=_to_decimal(salary.get("maximum")),
            salary_currency="SGD",
            salary_period=_normalize_period(salary_type),
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


def _parse_date(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    if "T" in value:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return datetime.fromisoformat(f"{value}T00:00:00+00:00")


def _to_decimal(value: object | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def _normalize_period(value: str | None) -> str | None:
    if not value:
        return None
    return value.lower()
