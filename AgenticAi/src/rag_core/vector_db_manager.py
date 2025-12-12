from qdrant_client import QdrantClient
import os
from src.core.settings import settings


qdrant_client = QdrantClient(
    url=settings.Qdrant_URL,
    api_key=settings.Qdrant_Api_Key,
)

print(qdrant_client.get_collections())