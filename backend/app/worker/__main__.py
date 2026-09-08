import argparse
import asyncio

from app.models.orm import Base
from app.db.session import engine
from app.worker.sync import sync_all


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")


async def run_sync(max_pages: int | None) -> None:
    init_db()
    results = await sync_all(max_pages=max_pages)
    for result in results:
        print(result)


def main() -> None:
    parser = argparse.ArgumentParser(description="Job portal worker")
    parser.add_argument("--init-db", action="store_true", help="Create database tables")
    parser.add_argument("--sync", action="store_true", help="Run ingestion sync")
    parser.add_argument("--max-pages", type=int, default=None, help="Limit pages per source for POC runs")
    args = parser.parse_args()

    if args.init_db:
        init_db()
    if args.sync:
        asyncio.run(run_sync(args.max_pages))
    if not args.init_db and not args.sync:
        parser.print_help()


if __name__ == "__main__":
    main()
