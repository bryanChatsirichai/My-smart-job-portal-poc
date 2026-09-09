import logging
import re
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import urlparse

import httpx

from app.adapters.base import FetchParams, JobSourceAdapter
from app.config import settings
from app.models.schemas import CanonicalJobInput, LocationSchema

logger = logging.getLogger(__name__)

LINKEDIN_JOBS_PER_PAGE = 25
_JOB_ID_PATTERN = re.compile(r"(?:view/|-)(\d+)")


class LinkedInAdapter(JobSourceAdapter):
    """LinkedIn jobs via self-hosted LinkedIn Jobs API — https://github.com/atharv01h/Linkedin-Jobs-Api"""

    source_name = "linkedin"

    @staticmethod
    def is_configured() -> bool:
        return bool(settings.linkedin_jobs_api_url.strip())

    async def fetch_jobs(self, params: FetchParams) -> list[dict]:
        if not self.is_configured():
            logger.warning("LinkedIn Jobs API URL not set; skip sync for source=linkedin")
            return []

        page = params.page + 1  # API pages are 1-based
        query: dict[str, str | int] = {"page": page}
        if settings.linkedin_keywords:
            query["keywords"] = settings.linkedin_keywords
        if settings.linkedin_location:
            query["location"] = settings.linkedin_location
        if settings.linkedin_date_since_posted:
            query["dateSincePosted"] = settings.linkedin_date_since_posted

        base_url = settings.linkedin_jobs_api_url.rstrip("/")
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.get(f"{base_url}/jobs/search", params=query)
            response.raise_for_status()
            data = response.json()
            if not data.get("success", True):
                logger.warning("LinkedIn Jobs API returned success=false")
                return []
            return data.get("jobs", [])

    def normalize(self, raw: dict) -> CanonicalJobInput:
        link = raw.get("link") or ""
        source_job_id = raw.get("id") or _extract_job_id(link) or link

        insights = raw.get("insights") or {}
        salary = insights.get("salaryRange") or {}
        seniority = insights.get("seniorityLevel")
        if seniority == "unknown":
            seniority = None

        employment_type = insights.get("jobType")
        if employment_type == "unknown":
            employment_type = None
        elif employment_type:
            employment_type = employment_type.replace("-", " ").title()

        skills = insights.get("requiredSkills") or []
        location_text = raw.get("location") or ""

        return CanonicalJobInput(
            source=self.source_name,
            source_job_id=str(source_job_id),
            title=raw.get("title", "Untitled role"),
            company_name=raw.get("company") or "Unknown company",
            company_uen=None,
            location=LocationSchema(
                address=location_text or None,
                district=None,
                region=location_text or None,
            ),
            salary_min=_to_decimal(salary.get("min")),
            salary_max=_to_decimal(salary.get("max")),
            salary_currency=salary.get("currency"),
            salary_period=_normalize_period(salary.get("period")),
            employment_type=employment_type,
            seniority_level=seniority,
            skills=skills,
            description=None,
            posted_date=_parse_date(raw.get("listDate")),
            expiry_date=None,
            apply_url=link or f"https://www.linkedin.com/jobs/view/{source_job_id}",
            raw_payload=raw,
        )


def _extract_job_id(link: str) -> str | None:
    if not link:
        return None
    match = _JOB_ID_PATTERN.search(link)
    if match:
        return match.group(1)
    path = urlparse(link).path.rstrip("/")
    if path:
        return path.split("/")[-1]
    return None


def _parse_date(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc)


def _to_decimal(value: object | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def _normalize_period(value: str | None) -> str | None:
    if not value or value == "unknown":
        return None
    if value == "yearly":
        return "annual"
    return value
