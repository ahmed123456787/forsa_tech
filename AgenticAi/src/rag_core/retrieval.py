from typing import List, Optional, Tuple
from langchain_core.documents import Document
from langchain_qdrant.qdrant import QdrantVectorStore as Qdrant
from src.core.settings import settings
from typing import Any, Optional
from src.rag_core.utils import get_jina_embeddings, get_qdrant_client



class VectorSearcher:
    """Handles semantic search operations on Qdrant vector store."""
    
    def __init__(self, collection_name: Optional[str] = None):
        self.collection_name = collection_name or settings.COLLECTION_NAME
        self.embeddings = get_jina_embeddings()
        self.client = get_qdrant_client()
        self.vectorstore = self._init_vectorstore()


    def _init_vectorstore(self) -> Qdrant:
        """Initialize the Qdrant vector store for searching."""
        return Qdrant(
            client=self.client,
            collection_name=self.collection_name,
            embedding=self.embeddings
        )

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Any] = None
    ) -> List[Document]:
        """
        Basic similarity search.
        
        Args:
            query: The search query string.
            k: Number of results to return (default=4).
            filter: Optional metadata filter.
            
        Returns:
            List of Document objects.
        """
        return self.vectorstore.similarity_search(
            query=query,
            k=k,
            filter=filter
        )


    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Any] = None
    ) -> List[Tuple[Document, float]]:
        """
        Similarity search with relevance scores.
        
        Args:
            query: The search query string.
            k: Number of results to return.
            filter: Optional metadata filter.
            
        Returns:
            List of (Document, score) tuples.
        """
        return self.vectorstore.similarity_search_with_score(
            query=query,
            k=k,
            filter=filter
        )


    def max_marginal_relevance_search(
        self,
        query: str,
        k: int = 4,
        fetch_k: int = 20,
        lambda_mult: float = 0.5,
        filter: Optional[Any] = None
    ) -> List[Document]:
        """
        Max marginal relevance search for diversity.
        
        Args:
            query: The search query string.
            k: Number of results to return.
            fetch_k: Initial pool size to select from.
            lambda_mult: Diversity control (0=max diversity, 1=max similarity).
            filter: Optional metadata filter.
            
        Returns:
            List of Document objects with diverse results.
        """
        return self.vectorstore.max_marginal_relevance_search(
            query=query,
            k=k,
            fetch_k=fetch_k,
            lambda_mult=lambda_mult,
            filter=filter
        )