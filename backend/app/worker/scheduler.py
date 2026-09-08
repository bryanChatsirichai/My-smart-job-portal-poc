import asyncio
import logging

from apscheduler.schedulers.blocking import BlockingScheduler

from app.config import settings
from app.worker.sync import sync_all

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_scheduler() -> None:
    scheduler = BlockingScheduler()

    @scheduler.scheduled_job("cron", hour=2, minute=0)
    def scheduled_sync() -> None:
        logger.info("starting scheduled sync")
        asyncio.run(sync_all())

    logger.info("scheduler started with cron %s", settings.sync_cron_schedule)
    scheduler.start()


if __name__ == "__main__":
    run_scheduler()
