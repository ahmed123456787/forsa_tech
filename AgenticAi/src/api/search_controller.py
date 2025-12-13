from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import logging
import time

from src.rag_core.ai_search import get_search_engine, AISearchEngine
from src.core.settings import settings

logger = logging.getLogger(__name__)

# =======================================================
# 1. REQUEST MODELS
# =======================================================

class HybridSearchRequest(BaseModel):
    """Request model for hybrid search (keyword + semantic)"""
    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Search query (can be keywords or natural language)"
    )
    keywords: Optional[List[str]] = Field(
        None,
        description="Additional keywords to emphasize"
    )
    category: Optional[str] = Field(
        None,
        description="Optional category filter"
    )
    top_k: int = Field(
        10,
        ge=1,
        le=50,
        description="Number of results to return"
    )
    
    class Config:
        example = {
            "query": "convention b2b tarif",
            "keywords": ["convention", "tarif", "b2b"],
            "category": "Convention",
            "top_k": 10
        }


# =======================================================
# 2. RESPONSE MODELS
# =======================================================

class FileReferenceResponse(BaseModel):
    """File reference information"""
    file_name: Optional[str] = Field(None, description="Name of the source file")
    file_path: Optional[str] = Field(None, description="Full path to the file")
    file_type: Optional[str] = Field(None, description="File type (PDF, DOCX, TXT, etc.)")
    page_number: Optional[int] = Field(None, description="Page number in document")
    chunk_index: Optional[int] = Field(None, description="Chunk/section index")
    source: Optional[str] = Field(None, description="Source location/URL")
    category: Optional[str] = Field(None, description="Document category")
    document_id: Optional[str] = Field(None, description="Unique document identifier")
    formatted: str = Field(..., description="Human-readable file reference")
    
    class Config:
        example = {
            "file_name": "offer_fibre.pdf",
            "file_path": "/docs/offers/offer_fibre.pdf",
            "file_type": "PDF",
            "page_number": 5,
            "chunk_index": 1,
            "source": "/docs/offers/offer_fibre.pdf",
            "category": "Offres",
            "document_id": "DOC_001",
            "formatted": "📄 offer_fibre.pdf | Page 5 | [Offres]"
        }


class SearchResultItem(BaseModel):
    """Single search result"""
    id: int = Field(..., description="Result index")
    content: str = Field(..., description="Full document content/text")
    snippet: str = Field(..., description="Preview snippet (first 200 chars)")
    relevance_score: float = Field(..., ge=0.0, le=1.0, description="Relevance score (0-1)")
    
    # File reference
    file_reference: FileReferenceResponse = Field(..., description="File source information")
    file_name: Optional[str] = Field(None, description="Convenience: filename")
    page_number: Optional[int] = Field(None, description="Convenience: page number")
    category: str = Field(..., description="Document category")
    source: Optional[str] = Field(None, description="Source location")
    
    class Config:
        example = {
            "id": 0,
            "content": "Idoom Fibre 1Gbps - 2,799 DA/month for Enterprise A...",
            "snippet": "Idoom Fibre 1Gbps - 2,799 DA/month for Enterprise A...",
            "relevance_score": 0.95,
            "file_reference": {
                "file_name": "offer_fibre.pdf",
                "file_path": "/docs/offers/offer_fibre.pdf",
                "file_type": "PDF",
                "page_number": 5,
                "category": "Offres",
                "formatted": "📄 offer_fibre.pdf | Page 5 | [Offres]"
            },
            "file_name": "offer_fibre.pdf",
            "page_number": 5,
            "category": "Offres",
            "source": "/docs/offers/offer_fibre.pdf"
        }


class UniqueFileReference(BaseModel):
    """Unique file referenced in search results"""
    file_name: Optional[str] = Field(None, description="Name of the file")
    file_path: Optional[str] = Field(None, description="Full path to the file")
    file_type: Optional[str] = Field(None, description="File type extension")
    category: Optional[str] = Field(None, description="Document category")
    source: Optional[str] = Field(None, description="Source location")
    formatted: str = Field(..., description="Human-readable reference")
    result_count: int = Field(..., description="Number of matches from this file")
    
    class Config:
        example = {
            "file_name": "offer_fibre.pdf",
            "file_path": "/docs/offers/offer_fibre.pdf",
            "file_type": "PDF",
            "category": "Offres",
            "source": "/docs/offers/offer_fibre.pdf",
            "formatted": "📄 offer_fibre.pdf | [Offres]",
            "result_count": 3
        }


class HybridSearchResponse(BaseModel):
    """Response for hybrid search"""
    success: bool = Field(..., description="Whether search was successful")
    search_type: str = Field("hybrid", description="Type of search performed")
    query: str = Field(..., description="The original search query")
    keywords: Optional[List[str]] = Field(None, description="Keywords used")
    category: Optional[str] = Field(None, description="Category filter used")
    total_found: int = Field(..., description="Total number of results")
    results: List[SearchResultItem] = Field(..., description="List of search results")
    files_referenced: List[UniqueFileReference] = Field(
        ...,
        description="Unique files referenced in results"
    )
    processing_time: float = Field(..., description="Processing time in seconds")
    timestamp: str = Field(..., description="Response timestamp")


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = Field(False, description="Always False for errors")
    error: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code")
    details: Optional[dict] = Field(None, description="Additional error details")
    timestamp: str = Field(..., description="Error timestamp")
    
    class Config:
        example = {
            "success": False,
            "error": "Invalid category provided",
            "error_code": "INVALID_CATEGORY",
            "details": {"provided": "InvalidCategory", "valid": ["Convention", "Offres", "Guide_NGBSS", "Depot_Vente"]},
            "timestamp": "2025-12-13T10:30:45.123Z"
        }


# =======================================================
# 3. ROUTER SETUP
# =======================================================

router = APIRouter(
    prefix="/search",
    tags=["Search"],
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    }
)

# Initialize search engine
search_engine = get_search_engine()


# =======================================================
# 4. HELPER FUNCTIONS
# =======================================================

def get_current_timestamp() -> str:
    """Get current ISO format timestamp"""
    return datetime.utcnow().isoformat(timespec='milliseconds') + 'Z'


def validate_category(category: Optional[str]) -> Optional[str]:
    """Validate category and return None if invalid"""
    valid_categories = ["Convention", "Offres", "Guide_NGBSS", "Depot_Vente"]
    if category and category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": f"Invalid category: {category}",
                "error_code": "INVALID_CATEGORY",
                "details": {
                    "provided": category,
                    "valid_categories": valid_categories
                },
                "timestamp": get_current_timestamp()
            }
        )
    return category


def _extract_unique_files(results: List[dict]) -> List[dict]:
    """Extract unique files from search results"""
    seen_files = set()
    unique_files = []
    
    for result in results:
        file_ref = result.get("file_reference", {})
        file_key = file_ref.get("file_name") or file_ref.get("source") or file_ref.get("file_path")
        
        if file_key and file_key not in seen_files:
            seen_files.add(file_key)
            unique_files.append({
                "file_name": file_ref.get("file_name"),
                "file_path": file_ref.get("file_path"),
                "file_type": file_ref.get("file_type"),
                "category": file_ref.get("category"),
                "source": file_ref.get("source"),
                "formatted": file_ref.get("formatted"),
                "result_count": sum(
                    1 for r in results
                    if (r.get("file_reference", {}).get("file_name") or
                        r.get("file_reference", {}).get("source")) == file_key
                )
            })
    
    return unique_files


# =======================================================
# 5. ENDPOINTS
# =======================================================

@router.post(
    "/hybrid",
    response_model=HybridSearchResponse,
    summary="Hybrid Search",
    description="Search using both keywords and semantic understanding"
)
async def hybrid_search(request: HybridSearchRequest) -> HybridSearchResponse:
    """
    Hybrid search combining keyword matching and semantic understanding.
    
    **Features:**
    - Combines keyword and semantic search
    - Better precision and recall
    - File references from both approaches
    - Deduplication of results
    
    **Example Request:**
    ```json
    {
        "query": "convention b2b tarif fibre",
        "keywords": ["convention", "b2b", "tarif"],
        "category": "Convention",
        "top_k": 15
    }
    ```
    
    **Returns:**
    - Merged and deduplicated results
    - Combined file references
    - Processing time
    """
    try:
        start_time = time.time()
        
        # Validate category
        category = validate_category(request.category)
        
        keywords = request.keywords or request.query.split()
        
        logger.info(
            f"Hybrid search: '{request.query}' + {keywords} | Category: {category}"
        )
        
        # Execute hybrid search
        results = search_engine._hybrid_search(
            query=request.query,
            keywords=keywords,
            category=category,
            top_k=request.top_k
        )
        
        # Extract unique files
        files_referenced = _extract_unique_files(results)
        
        processing_time = time.time() - start_time
        
        return HybridSearchResponse(
            success=True,
            search_type="hybrid",
            query=request.query,
            keywords=keywords,
            category=category,
            total_found=len(results),
            results=[SearchResultItem(**r) for r in results],
            files_referenced=[UniqueFileReference(**f) for f in files_referenced],
            processing_time=round(processing_time, 3),
            timestamp=get_current_timestamp()
        )
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Hybrid search error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"Search failed: {str(e)}",
                "error_code": "HYBRID_SEARCH_ERROR",
                "timestamp": get_current_timestamp()
            }
        )