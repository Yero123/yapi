from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://yapi:yapi@localhost:5432/yapi"
    cors_origins: str = "http://localhost:5173"

    llm_api_key: str = ""
    llm_base_url: str = "https://api.minimax.io/v1"
    llm_model: str = "MiniMax-M2"

    # New guests start with example budgets, transactions and one assistant exchange.
    seed_sample_data: bool = True

    chat_max_message_chars: int = 1000
    chat_rate_limit_per_minute: int = 20
    chat_history_window: int = 20

    # Per client address, on top of the per-guest chat limit: guests are free to create.
    guest_rate_limit_per_hour_per_ip: int = 10
    chat_rate_limit_per_hour_per_ip: int = 60

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, url: str) -> str:
        # Hosts hand out plain postgres:// strings; SQLAlchemy needs the driver named.
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg://" + url[len(prefix):]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
