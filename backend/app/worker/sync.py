import logging

from app.adapters.adzuna.adapter import AdzunaAdapter
from app.adapters.base import FetchParams, JobSourceAdapter
from app.adapters.mycareersfuture.adapter import MyCareersFutureAdapter
from app.config import settings
from app.db.session import SessionLocal
from app.db.upsert import expire_stale_jobs, upsert_job

logger = logging.getLogger(__name__)


def get_adapters() -> list[JobSourceAdapter]:
    adapters: list[JobSourceAdapter] = [MyCareersFutureAdapter()]
    if AdzunaAdapter.is_configured():
        adapters.append(AdzunaAdapter())
    else:
        logger.info("Adzuna adapter not registered (set ADZUNA_APP_ID and ADZUNA_APP_KEY)")
    return adapters


def _page_size(adapter: JobSourceAdapter) -> int:
    if adapter.source_name == "adzuna":
        return settings.adzuna_page_size
    return settings.mcf_page_size


async def sync_source(adapter: JobSourceAdapter, max_pages: int | None = None) -> dict[str, int | str]:
    if adapter.source_name == "adzuna" and not AdzunaAdapter.is_configured():
        return {"source": adapter.source_name, "skipped": "not_configured"}

    page_size = _page_size(adapter)
    seen_ids: set[str] = set()
    fetched = 0
    upserted = 0
    page = 0

    while True:
        if max_pages is not None and page >= max_pages:
            break

        raw_jobs = await adapter.fetch_jobs(FetchParams(page=page, limit=page_size))
        if not raw_jobs:
            break

        fetched += len(raw_jobs)
        db = SessionLocal()
        try:
            for raw in raw_jobs:
                normalized = adapter.normalize(raw)
                upsert_job(db, normalized)
                seen_ids.add(normalized.source_job_id)
                upserted += 1
        finally:
            db.close()

        if len(raw_jobs) < page_size:
            break
        page += 1

    db = SessionLocal()
    try:
        expired = expire_stale_jobs(db, adapter.source_name, seen_ids)
    finally:
        db.close()

    stats = {"fetched": fetched, "upserted": upserted, "expired": expired}
    logger.info("sync complete", extra={"source": adapter.source_name, **stats})
    return stats


async def sync_all(max_pages: int | None = None) -> list[dict[str, int | str]]:
    results: list[dict[str, int | str]] = []
    for adapter in get_adapters():
        try:
            stats = await sync_source(adapter, max_pages=max_pages)
            results.append({"source": adapter.source_name, **stats})
        except Exception:
            logger.exception("sync failed for source %s", adapter.source_name)
            results.append({"source": adapter.source_name, "error": "sync_failed"})
    return results