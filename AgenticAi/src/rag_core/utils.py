from typing import List, Dict, Any
from langchain_core.documents import Document
from langchain_experimental.text_splitter import SemanticChunker
from langchain_community.embeddings import JinaEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from src.core.settings import settings


def get_jina_embeddings() -> JinaEmbeddings:
    """Initialize Jina embeddings."""
    return JinaEmbeddings(
        jina_api_key=settings.JINA_API_KEY,
        model_name=settings.MODEL_NAME
    )


def get_qdrant_client() -> QdrantClient:
    """Initialize Qdrant client."""
    return QdrantClient(
        url=settings.Qdrant_URL,
        api_key=settings.Qdrant_Api_Key,
        prefer_grpc=True,
        timeout=60
    )


def create_collection_if_not_exists(client: QdrantClient, collection_name: str, embedding_dim: int) -> None:
    """Create collection if it doesn't exist."""
    collections = client.get_collections().collections
    collection_exists = any(c.name == collection_name for c in collections)
    
    if not collection_exists:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=embedding_dim,
                distance=Distance.COSINE
            )
        )
    else:
        print(f"Collection '{collection_name}' already exists.")

def prepare_document(text: str, metadata: Dict[str, Any]) -> Document:
    """Prepare a LangChain document from text and metadata."""
    return Document(
        page_content=text,
        metadata=metadata
    )


def semantic_chunk_document(document: Document) -> List[Document]:
    """Split document into semantic chunks."""
    splitter = SemanticChunker(embeddings=get_jina_embeddings())
    return splitter.split_documents([document])


def extract_metadata_from_data_entry(data_entry: Dict[str, Any]) -> Dict[str, Any]:
    """Extract metadata from data entry."""
    return {
        "ID_categorie": data_entry.get("category", "Autre_Non_Identifie"),
        "partner": data_entry.get("partner", "Inconnu"),
        "offer_type": data_entry.get("offer_type", "N/A"),
        "source_file": data_entry.get("source_file", "Fichier_Inconnu"),
        "summary": data_entry.get("summary", "Résumé non disponible."),
        "original_id": data_entry.get("id"),
        "timestamp": data_entry.get("timestamp")
    }