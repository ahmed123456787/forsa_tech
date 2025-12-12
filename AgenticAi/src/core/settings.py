from pydantic_settings import BaseSettings
from pathlib import Path



class Settings(BaseSettings):
    DATABASE_URL: str
    Qdrant_Api_Key: str
    Qdrant_URL: str
    OPENAI_API_KEY: str


    class Config:
        # Get the directory of this file and construct path to .env
        env_file = Path(__file__).parent.parent.parent / ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()