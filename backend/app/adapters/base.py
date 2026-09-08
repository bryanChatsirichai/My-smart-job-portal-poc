from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models.schemas import CanonicalJobInput


@dataclass
class FetchParams:
    page: int = 0
    limit: int = 100


class JobSourceAdapter(ABC):
    source_name: str

    @abstractmethod
    async def fetch_jobs(self, params: FetchParams) -> list[dict]:
        raise NotImplementedError

    @abstractmethod
    def normalize(self, raw: dict) -> CanonicalJobInput:
        raise NotImplementedError
