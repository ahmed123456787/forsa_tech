from typing import Dict, Any, List, Optional
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from src.core.settings import settings
from src.rag_core.vector_db_manager import qdrant_client, get_vector_store
from src.rag_core.utils import (
    get_jina_embeddings,
    create_collection_if_not_exists,
    prepare_document,
    semantic_chunk_document,
    extract_metadata_from_data_entry
)



class VectorIndexer:
    """Handles indexing documents into Qdrant vector store."""
    
    def __init__(self, collection_name: Optional[str] = None):
        self.collection_name = collection_name or settings.COLLECTION_NAME
        self.embeddings = get_jina_embeddings()
        self.client = qdrant_client
        
    def index_document(self, data_entry: Dict[str, Any]) -> int:
        """
        Index a single document.
        
        Args:
            data_entry: Dictionary containing document data
            
        Returns:
            Number of chunks indexed
        """
        text_to_index = data_entry.pop("cleaned_text", "")
        
        if not text_to_index:
            return 0
        
        # Prepare metadata
        metadata = extract_metadata_from_data_entry(data_entry)
        
        
        # Create document
        document = prepare_document(text_to_index, metadata)
        
        # Semantic chunking
        chunks = semantic_chunk_document(document)
        
        # Index chunks
        self._index_chunks(chunks)
        
        return len(chunks)
    
    def index_documents(self, documents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Index multiple documents.
        
        Args:
            documents: List of document dictionaries
            
        Returns:
            Statistics about indexing
        """
        stats = {
            "total_documents": len(documents),
            "total_chunks": 0,
            "successful": 0,
            "failed": 0
        }
        
        for i, doc in enumerate(documents, 1):
            try:
                chunks_count = self.index_document(doc.copy())
                stats["total_chunks"] += chunks_count
                stats["successful"] += 1
            except Exception as e:
                stats["failed"] += 1
        
        return stats
    
    
    def _index_chunks(self, chunks: List[Document]) -> None:
        """Index chunks into Qdrant."""
        # Ensure collection exists
        embedding_dim = len(self.embeddings.embed_query("test"))
        create_collection_if_not_exists(self.client, self.collection_name, embedding_dim)
        
        # Index using Qdrant
        vectorstore = get_vector_store(self.collection_name)
        vectorstore.add_documents(chunks)
        
        # Verify
        collection_info = self.client.get_collection(self.collection_name)
    
    
    def delete_collection(self) -> bool:
        """Delete the entire collection."""
        try:
            self.client.delete_collection(collection_name=self.collection_name)
            return True
        except Exception as e:
            return False
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the collection."""
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "name": info.config.params.vectors.size,
                "vector_size": info.config.params.vectors.size,
                "points_count": info.points_count,
                "status": info.status
            }
        except Exception as e:
            return {}