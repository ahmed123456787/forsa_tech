from langchain_community.vectorstores import Qdrant
from qdrant_client import QdrantClient
from src.rag_core.utils import get_jina_embeddings


qdrant_client = QdrantClient(url="http://localhost:6333",timeout=60)

def get_vector_store(collection_name: str) -> Qdrant:
    """
    Initializes and returns a Qdrant vector store instance for a specific collection.
    """
    embeddings = get_jina_embeddings()
    return Qdrant(
        client=qdrant_client,
        collection_name=collection_name,
        embeddings=embeddings
    )
