"""LinkedIn jobs adapter via self-hosted LinkedIn Jobs API.

Wraps: https://github.com/atharv01h/Linkedin-Jobs-Api

Requires ``LINKEDIN_JOBS_API_URL`` pointing at a running instance. Search
filters (location, keywords, recency) come from application settings. The
upstream API uses 1-based pages; this adapter accepts 0-based ``FetchParams``.
"""

import logging
import re
from urllib.parse import urlparse

import httpx

from app.adapters.base import FetchParams, JobSourceAdapter
from app.adapters.utils import normalize_salary_period, parse_datetime, to_decimal
from app.config import settings
from app.models.schemas import CanonicalJobInput, LocationSchema

logger = logging.getLogger(__name__)

# Matches numeric IDs in URLs like /jobs/view/12345 or /jobs/view-12345.
_JOB_ID_PATTERN = re.compile(r"(?:view/|-)(\d+)")


class LinkedInAdapter(JobSourceAdapter):
    """Fetches job listings from a self-hosted LinkedIn Jobs API service."""

    source_name = "linkedin"

    @staticmethod
    def is_configured() -> bool:
        """Return True when the adapter is enabled and the API base URL is set."""
        return settings.linkedin_enabled and bool(settings.linkedin_jobs_api_url.strip())

    async def fetch_jobs(self, params: FetchParams) -> list[dict]:
        if not self.is_configured():
            logger.warning("LinkedIn Jobs API URL not set; skip sync for source=linkedin")
            return []

        page = params.page + 1
        query: dict[str, str | int] = {
            "page": page,
            "location": settings.linkedin_location,
        }
        if settings.linkedin_keywords:
            query["keywords"] = settings.linkedin_keywords
        if settings.linkedin_date_since_posted:
            query["dateSincePosted"] = settings.linkedin_date_since_posted

        base_url = settings.linkedin_jobs_api_url.rstrip("/")
        url = f"{base_url}/jobs/search"
        logger.info("LinkedIn Jobs API request: %s params=%s", url, query)
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.get(url, params=query)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            logger.warning("LinkedIn Jobs API request failed (page=%s): %s", page, exc)
            return []

        if not data.get("success", True):
            logger.warning("LinkedIn Jobs API returned success=false (page=%s)", page)
            return []

        jobs = data.get("jobs", [])
        logger.info("LinkedIn Jobs API page %s returned %s jobs", page, len(jobs))
        return jobs

    def normalize(self, raw: dict) -> CanonicalJobInput:
        """Map a LinkedIn Jobs API record to ``CanonicalJobInput``."""
        link = raw.get("link") or ""
        source_job_id = raw.get("id") or _extract_job_id(link) or link

        # Salary, seniority, and employment metadata live under ``insights``.
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
            salary_min=to_decimal(salary.get("min")),
            salary_max=to_decimal(salary.get("max")),
            salary_currency=salary.get("currency"),
            salary_period=normalize_salary_period(salary.get("period")),
            employment_type=employment_type,
            seniority_level=seniority,
            skills=skills,
            description=None,
            posted_date=parse_datetime(raw.get("listDate")),
            expiry_date=None,
            apply_url=link or f"https://www.linkedin.com/jobs/view/{source_job_id}",
            raw_payload=raw,
        )


def _extract_job_id(link: str) -> str | None:
    """Derive a stable job ID from a LinkedIn job URL when ``id`` is absent."""
    if not link:
        return None
    match = _JOB_ID_PATTERN.search(link)
    if match:
        return match.group(1)
    path = urlparse(link).path.rstrip("/")
    if path:
        return path.split("/")[-1]
    return None
