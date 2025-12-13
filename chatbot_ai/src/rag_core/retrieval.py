from typing import List, Optional, Tuple, Dict, Any, Union
from langchain_core.documents import Document
from langchain_qdrant.qdrant import QdrantVectorStore as Qdrant
from qdrant_client.http import models as qdrant_models
from src.core.settings import settings
from src.rag_core.utils import get_jina_embeddings, get_qdrant_client


class VectorSearcher:
    """Handles semantic search operations on Qdrant vector store with metadata filtering."""
    
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
    
    def _build_qdrant_filter(
        self, 
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> Optional[qdrant_models.Filter]:
        """
        Build Qdrant filter from metadata dictionary.
        
        Args:
            metadata_filters: Dictionary of metadata filters
                Example: {"partner": "L'établissement P", "ID_categorie": "Convention"}
                
        Returns:
            Qdrant filter object or None
        """
        if not metadata_filters:
            return None
        
        must_conditions = []
        
        for key, value in metadata_filters.items():
            if value is None:
                continue
                
            if isinstance(value, list):
                # Match any value in the list
                must_conditions.append(
                    qdrant_models.FieldCondition(
                        key=f"metadata.{key}",
                        match=qdrant_models.MatchAny(any=value)
                    )
                )
            else:
                # Exact match for single value
                must_conditions.append(
                    qdrant_models.FieldCondition(
                        key=f"metadata.{key}",
                        match=qdrant_models.MatchValue(value=value)
                    )
                )
        
        if must_conditions:
            return qdrant_models.Filter(must=must_conditions)
        
        return None
    
    def similarity_search(
        self,
        query: str,
        k: int = 4,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Basic similarity search with metadata filtering.
        
        Args:
            query: The search query string.
            k: Number of results to return (default=4).
            metadata_filters: Dictionary of metadata filters to narrow search.
            
        Returns:
            List of Document objects.
        """
        qdrant_filter = self._build_qdrant_filter(metadata_filters)
        
        return self.vectorstore.similarity_search(
            query=query,
            k=k,
            filter=qdrant_filter
        )
    
    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
        metadata_filters: Optional[Dict[str, Any]] = None,
        score_threshold: Optional[float] = None
    ) -> List[Tuple[Document, float]]:
        """
        Similarity search with relevance scores and metadata filtering.
        
        Args:
            query: The search query string.
            k: Number of results to return.
            metadata_filters: Dictionary of metadata filters.
            score_threshold: Minimum similarity score (0-1).
            
        Returns:
            List of (Document, score) tuples.
        """
        qdrant_filter = self._build_qdrant_filter(metadata_filters)
        
        results = self.vectorstore.similarity_search_with_score(
            query=query,
            k=k,
            filter=qdrant_filter
        )
        
        # Apply score threshold if provided
        if score_threshold is not None:
            results = [(doc, score) for doc, score in results if score >= score_threshold]
        
        return results
    
    def max_marginal_relevance_search(
        self,
        query: str,
        k: int = 4,
        fetch_k: int = 20,
        lambda_mult: float = 0.5,
        metadata_filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Max marginal relevance search with metadata filtering.
        
        Args:
            query: The search query string.
            k: Number of results to return.
            fetch_k: Initial pool size to select from.
            lambda_mult: Diversity control (0=max diversity, 1=max similarity).
            metadata_filters: Dictionary of metadata filters.
            
        Returns:
            List of Document objects with diverse results.
        """
        qdrant_filter = self._build_qdrant_filter(metadata_filters)
        
        return self.vectorstore.max_marginal_relevance_search(
            query=query,
            k=k,
            fetch_k=fetch_k,
            lambda_mult=lambda_mult,
            filter=qdrant_filter
        )
    
    def search_by_category(
        self,
        query: str,
        category: str,
        k: int = 4
    ) -> List[Document]:
        """
        Search within a specific category.
        
        Args:
            query: The search query string.
            category: The category to filter by (e.g., "Convention", "FAQ").
            k: Number of results to return.
            
        Returns:
            List of Document objects.
        """
        return self.similarity_search(
            query=query,
            k=k,
            metadata_filters={"ID_categorie": category}
        )
    
    def search_by_partner(
        self,
        query: str,
        partner: str,
        k: int = 4
    ) -> List[Document]:
        """
        Search within a specific partner's documents.
        
        Args:
            query: The search query string.
            partner: The partner to filter by (e.g., "L'établissement P").
            k: Number of results to return.
            
        Returns:
            List of Document objects.
        """
        return self.similarity_search(
            query=query,
            k=k,
            metadata_filters={"partner": partner}
        )
    
    def search_by_offer_type(
        self,
        query: str,
        offer_type: Union[str, List[str]],
        k: int = 4
    ) -> List[Document]:
        """
        Search within specific offer types.
        
        Args:
            query: The search query string.
            offer_type: Single offer type or list (e.g., "Fibre" or ["ADSL", "VDSL"]).
            k: Number of results to return.
            
        Returns:
            List of Document objects.
        """
        if isinstance(offer_type, str):
            offer_type = [offer_type]
        
        return self.similarity_search(
            query=query,
            k=k,
            metadata_filters={"offer_type": offer_type}
        )
    
    def smart_search(
        self,
        query: str,
        k: int = 4,
        category: Optional[str] = None,
        partner: Optional[str] = None,
        offer_type: Optional[Union[str, List[str]]] = None,
        use_mmr: bool = False,
        score_threshold: float = 0.7
    ) -> List[Document]:
        """
        Smart search with multiple filter options and optimization.
        
        Args:
            query: The search query string.
            k: Number of results to return.
            category: Filter by category.
            partner: Filter by partner.
            offer_type: Filter by offer type.
            use_mmr: Whether to use MMR for diversity.
            score_threshold: Minimum similarity score.
            
        Returns:
            List of Document objects.
        """
        # Build metadata filters
        metadata_filters = {}
        if category:
            metadata_filters["ID_categorie"] = category
        if partner:
            metadata_filters["partner"] = partner
        if offer_type:
            metadata_filters["offer_type"] = offer_type if isinstance(offer_type, list) else [offer_type]
        
        if use_mmr:
            return self.max_marginal_relevance_search(
                query=query,
                k=k,
                metadata_filters=metadata_filters
            )
        else:
            results = self.similarity_search_with_score(
                query=query,
                k=k * 2,  # Get more initially to filter by score
                metadata_filters=metadata_filters
            )
            
            # Filter by score threshold
            filtered_results = [(doc, score) for doc, score in results if score >= score_threshold]
            
            # Return top k after filtering
            return [doc for doc, _ in filtered_results[:k]]