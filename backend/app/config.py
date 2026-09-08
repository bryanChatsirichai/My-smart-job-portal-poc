from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./jobportal.db"
    cors_origins: str = "http://localhost:5173"
    sync_cron_schedule: str = "0 2 * * *"
    mcf_page_size: int = 100
    adzuna_page_size: int = 50
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""


settings = Settings()
