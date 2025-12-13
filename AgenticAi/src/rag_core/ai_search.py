from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from typing import Optional
import logging
import json
import os

from src.rag_core.retrieval import VectorSearcher
from src.core.settings import settings

logger = logging.getLogger(__name__)

# =======================================================
# 1. CONFIGURATION
# =======================================================
DEEPSEEK_API_KEY = "01Gu-xIiEQJWwuikkIdaPSSViTJLBpiUN9erLplVzCDJPErt8Qz8EcQ_t3YtzerzjpZ1wTNqof74JIYOfGBrqA"
DEEPSEEK_BASE_URL = "https://api.modelarts-maas.com/v2"
DEEPSEEK_MODEL = "deepseek-v3.1"
COLLECTION_NAME = settings.COLLECTION_NAME
VALID_CATEGORIES = ["Convention", "Offres", "Guide_NGBSS", "Depot_Vente"]


# =======================================================
# 2. FILE REFERENCE HELPER
# =======================================================
class FileReference:
    """Helper class to extract and format file references from metadata"""
    
    @staticmethod
    def extract(metadata: dict) -> dict:
        """
        Extract file reference information from document metadata.
        
        Args:
            metadata: Document metadata dictionary
            
        Returns:
            Dict with file reference details
        """
        # Common metadata fields for file sources
        file_ref = {
            "file_name": None,
            "file_path": None,
            "page_number": None,
            "chunk_index": None,
            "source": None,
            "category": None,
            "document_id": None,
            "file_type": None,
        }
        
        # Extract file name from various possible metadata keys
        file_ref["file_name"] = (
            metadata.get("file_name") or
            metadata.get("filename") or
            metadata.get("name") or
            metadata.get("source_file") or
            FileReference._extract_filename_from_source(metadata.get("source", ""))
        )
        
        # Extract file path/source
        file_ref["file_path"] = (
            metadata.get("file_path") or
            metadata.get("source") or
            metadata.get("path") or
            metadata.get("document_path")
        )
        
        # Extract source URL or location
        file_ref["source"] = (
            metadata.get("source") or
            metadata.get("url") or
            metadata.get("file_path")
        )
        
        # Extract page number
        file_ref["page_number"] = (
            metadata.get("page") or
            metadata.get("page_number") or
            metadata.get("page_num") or
            metadata.get("pg")
        )
        
        # Extract chunk/section index
        file_ref["chunk_index"] = (
            metadata.get("chunk_index") or
            metadata.get("chunk_id") or
            metadata.get("section") or
            metadata.get("index")
        )
        
        # Extract category
        file_ref["category"] = (
            metadata.get("ID_categorie") or
            metadata.get("category") or
            metadata.get("doc_type")
        )
        
        # Extract document ID
        file_ref["document_id"] = (
            metadata.get("document_id") or
            metadata.get("doc_id") or
            metadata.get("id")
        )
        
        # Determine file type from extension or metadata
        file_ref["file_type"] = (
            metadata.get("file_type") or
            metadata.get("type") or
            FileReference._extract_file_type(file_ref["file_name"])
        )
        
        return file_ref
    
    @staticmethod
    def _extract_filename_from_source(source: str) -> Optional[str]:
        """Extract filename from a full path or URL"""
        if not source:
            return None
        # Handle both Windows and Unix paths
        try:
            return os.path.basename(source)
        except:
            return source.split("/")[-1].split("\\")[-1] if source else None
    
    @staticmethod
    def _extract_file_type(filename: Optional[str]) -> Optional[str]:
        """Extract file type from filename extension"""
        if not filename:
            return None
        if "." in filename:
            return filename.split(".")[-1].upper()
        return None
    
    @staticmethod
    def format_reference(file_ref: dict) -> str:
        """
        Format file reference as a readable string.
        
        Args:
            file_ref: File reference dictionary
            
        Returns:
            Formatted string like "Document: offer_fibre.pdf (Page 5)"
        """
        parts = []
        
        if file_ref.get("file_name"):
            parts.append(f"📄 {file_ref['file_name']}")
        elif file_ref.get("source"):
            parts.append(f"📄 {os.path.basename(str(file_ref['source']))}")
        
        if file_ref.get("page_number"):
            parts.append(f"Page {file_ref['page_number']}")
        
        if file_ref.get("category"):
            parts.append(f"[{file_ref['category']}]")
        
        return " | ".join(parts) if parts else "Unknown source"


# =======================================================
# 3. AI SEARCH ENGINE CLASS
# =======================================================
class AISearchEngine:
    """
    AI-Powered Search Engine for document discovery.
    Returns file references with each search result.
    """
    
    def __init__(self):
        self.searcher = VectorSearcher(collection_name=COLLECTION_NAME)
        self.llm = ChatOpenAI(
            model=DEEPSEEK_MODEL,
            api_key=DEEPSEEK_API_KEY,
            base_url=DEEPSEEK_BASE_URL,
            temperature=0.0,
        )
        self._setup_prompts()
        logger.info("AISearchEngine initialized")
    
    def _setup_prompts(self):
        """Initialize prompt templates for search operations"""
        
        # Intent extraction prompt
        self.intent_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a search query analyzer for Algérie Télécom documents.
Analyze the user's query and extract:
1. keywords: Important search terms (list of strings)
2. category: One of {categories} if detectable, otherwise null
3. search_type: 'keyword' for simple lookups, 'semantic' for complex questions, 'hybrid' for both
4. refined_query: Optimized search query

Respond ONLY with valid JSON:
{{"keywords": ["term1", "term2"], "category": "Category or null", "search_type": "keyword|semantic|hybrid", "refined_query": "optimized query"}}

Categories: {categories}"""),
            ("human", "{query}")
        ])
        
        # Agent conversation prompt
        self.agent_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a document search assistant for Algérie Télécom.
Help users find documents by understanding their needs.

Available categories: {categories}

Based on the user's message:
- If you need more information, ask a clarifying question
- If you have enough info, provide search parameters

Respond ONLY with valid JSON:
{{"action": "clarify", "message": "your clarifying question"}}
OR
{{"action": "search", "message": "searching for...", "search_params": {{"query": "search query", "category": "category or null", "keywords": ["key", "words"]}}}}"""),
            ("human", "History: {history}\n\nUser: {message}")
        ])
        
        # Search results summary prompt (includes file references)
        self.summary_prompt = ChatPromptTemplate.from_messages([
            ("system", """Summarize the search results for the user in a helpful way.
Mention the documents found and their sources/file names.
Be concise but informative. Respond in the same language as the query.

Query: {query}
Results found: {count}

Documents Found:
{results}

Include the file references in your response so users know where to find the information."""),
            ("human", "Provide a summary with file references")
        ])
    
    # =======================================================
    # KEYWORD SEARCH
    # =======================================================
    def keyword_search(
        self, 
        keywords: list[str], 
        category: Optional[str] = None,
        top_k: int = 10
    ) -> list[dict]:
        """
        Search documents by keywords. Returns results with file references.
        
        Args:
            keywords: List of keywords to search for
            category: Optional category filter
            top_k: Number of results
            
        Returns:
            List of document results with file references
        """
        query = " ".join(keywords)
        filters = {"ID_categorie": category} if category in VALID_CATEGORIES else None
        
        logger.info(f"Keyword search: '{query}' | Category: {category}")
        
        docs = self.searcher.similarity_search(
            query=query,
            k=top_k,
            metadata_filters=filters
        )
        
        return self._format_results_with_files(docs, query)
    
    # =======================================================
    # SEMANTIC SEARCH
    # =======================================================
    def semantic_search(
        self,
        query: str,
        category: Optional[str] = None,
        top_k: int = 10
    ) -> list[dict]:
        """
        Search documents using natural language. Returns results with file references.
        
        Args:
            query: Natural language query
            category: Optional category filter
            top_k: Number of results
            
        Returns:
            List of document results with file references
        """
        filters = {"ID_categorie": category} if category in VALID_CATEGORIES else None
        
        logger.info(f"Semantic search: '{query}' | Category: {category}")
        
        docs = self.searcher.similarity_search(
            query=query,
            k=top_k,
            metadata_filters=filters
        )
        
        return self._format_results_with_files(docs, query)
    
    # =======================================================
    # SMART SEARCH (AI-POWERED)
    # =======================================================
    def smart_search(self, query: str, top_k: int = 10) -> dict:
        """
        AI-powered search that returns results with file references.
        
        Args:
            query: User's search query
            top_k: Number of results
            
        Returns:
            Dict with intent, results, and file references
        """
        # Extract intent using AI
        intent = self._extract_intent(query)
        logger.info(f"Smart search intent: {intent}")
        
        # Execute search based on detected intent
        category = intent.get("category")
        if category and category not in VALID_CATEGORIES:
            category = None
        
        if intent["search_type"] == "keyword":
            results = self.keyword_search(
                keywords=intent["keywords"],
                category=category,
                top_k=top_k
            )
        elif intent["search_type"] == "semantic":
            results = self.semantic_search(
                query=intent["refined_query"],
                category=category,
                top_k=top_k
            )
        else:  # hybrid
            results = self._hybrid_search(
                query=intent["refined_query"],
                keywords=intent["keywords"],
                category=category,
                top_k=top_k
            )
        
        # Extract unique files from results
        unique_files = self._get_unique_files(results)
        
        return {
            "query": query,
            "intent": intent,
            "results": results,
            "total_found": len(results),
            "files_referenced": unique_files
        }
    
    # =======================================================
    # AGENT SEARCH (CONVERSATIONAL)
    # =======================================================
    def agent_search(
        self,
        message: str,
        conversation_history: Optional[list[dict]] = None
    ) -> dict:
        """
        Conversational search agent. Returns file references with results.
        
        Args:
            message: User's message
            conversation_history: Previous conversation turns
            
        Returns:
            Agent response with file references
        """
        # Format history
        history = ""
        if conversation_history:
            history = "\n".join([
                f"{turn['role']}: {turn['content']}" 
                for turn in conversation_history[-5:]
            ])
        
        # Get agent response
        response = self.llm.invoke(
            self.agent_prompt.format_messages(
                categories=", ".join(VALID_CATEGORIES),
                history=history or "No previous conversation",
                message=message
            )
        )
        
        # Parse response
        try:
            agent_response = json.loads(response.content)
        except json.JSONDecodeError:
            agent_response = {
                "action": "search",
                "message": "Searching for your request...",
                "search_params": {"query": message, "category": None, "keywords": message.split()}
            }
        
        # If agent decides to search, execute it
        if agent_response.get("action") == "search":
            params = agent_response.get("search_params", {})
            search_result = self.smart_search(
                query=params.get("query", message),
                top_k=10
            )
            agent_response["results"] = search_result["results"]
            agent_response["total_found"] = search_result["total_found"]
            agent_response["files_referenced"] = search_result["files_referenced"]
        
        return agent_response
    
    # =======================================================
    # STREAMING AGENT SEARCH
    # =======================================================
    def agent_search_stream(
        self,
        message: str,
        conversation_history: Optional[list[dict]] = None
    ):
        """
        Streaming conversational search with file references.
        Yields chunks for real-time display.
        """
        # First get search results
        search_result = self.smart_search(message, top_k=5)
        
        # Format results for summary (including file references)
        results_text = "\n".join([
            f"• {r['file_reference']['formatted']} - {r['snippet'][:100]}..."
            for r in search_result["results"][:5]
        ])
        
        # Stream the summary
        for chunk in self.llm.stream(
            self.summary_prompt.format_messages(
                query=message,
                count=search_result["total_found"],
                results=results_text or "No results found"
            )
        ):
            yield {"type": "text", "content": chunk.content}
        
        # Yield documents and file references at the end
        yield {
            "type": "documents",
            "content": search_result["results"],
            "files_referenced": search_result["files_referenced"]
        }
    
    # =======================================================
    # PRIVATE HELPER METHODS
    # =======================================================
    def _extract_intent(self, query: str) -> dict:
        """Extract search intent from query using AI"""
        try:
            response = self.llm.invoke(
                self.intent_prompt.format_messages(
                    categories=", ".join(VALID_CATEGORIES),
                    query=query
                )
            )
            return json.loads(response.content)
        except Exception as e:
            logger.warning(f"Intent extraction failed: {e}")
            return {
                "keywords": query.split()[:5],
                "category": None,
                "search_type": "hybrid",
                "refined_query": query
            }
    
    def _hybrid_search(
        self,
        query: str,
        keywords: list[str],
        category: Optional[str],
        top_k: int
    ) -> list[dict]:
        """Combine semantic and keyword search results"""
        filters = {"ID_categorie": category} if category else None
        
        # Semantic search
        semantic_docs = self.searcher.similarity_search(
            query=query, k=top_k, metadata_filters=filters
        )
        
        # Keyword search
        keyword_docs = self.searcher.similarity_search(
            query=" ".join(keywords), k=top_k // 2, metadata_filters=filters
        ) if keywords else []
        
        # Merge and deduplicate
        seen = set()
        merged = []
        for doc in semantic_docs + keyword_docs:
            content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
            content_hash = hash(content[:100])
            if content_hash not in seen:
                seen.add(content_hash)
                merged.append(doc)
        
        return self._format_results_with_files(merged[:top_k], query)
    
    def _format_results_with_files(self, docs: list, query: str) -> list[dict]:
        """Format documents into search results with file references"""
        results = []
        for i, doc in enumerate(docs):
            content = doc.page_content if hasattr(doc, 'page_content') else str(doc)
            metadata = doc.metadata if hasattr(doc, 'metadata') else {}
            
            # Extract file reference
            file_ref = FileReference.extract(metadata)
            formatted_ref = FileReference.format_reference(file_ref)
            
            snippet = content[:200] + "..." if len(content) > 200 else content
            
            results.append({
                "id": i,
                "content": content,
                "snippet": snippet,
                "relevance_score": round(1.0 - (i * 0.05), 2),
                # File reference information
                "file_reference": {
                    **file_ref,
                    "formatted": formatted_ref
                },
                # Keep original metadata for reference
                "metadata": metadata,
                # Convenience fields
                "file_name": file_ref["file_name"],
                "page_number": file_ref["page_number"],
                "category": file_ref["category"] or metadata.get("ID_categorie", "Unknown"),
                "source": file_ref["source"],
            })
        
        return results
    
    def _get_unique_files(self, results: list[dict]) -> list[dict]:
        """Extract unique file references from results"""
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
# 4. SINGLETON & CONVENIENCE FUNCTIONS
# =======================================================
_search_engine: Optional[AISearchEngine] = None


def get_search_engine() -> AISearchEngine:
    """Get or create singleton search engine"""
    global _search_engine
    if _search_engine is None:
        _search_engine = AISearchEngine()
    return _search_engine


def quick_search(query: str, category: Optional[str] = None, top_k: int = 10) -> list[dict]:
    """Quick search function - returns results with file references"""
    engine = get_search_engine()
    if category:
        return engine.semantic_search(query, category, top_k)
    return engine.smart_search(query, top_k)["results"]


def search_files(query: str, top_k: int = 10) -> list[dict]:
    """Search and return only unique files referenced"""
    engine = get_search_engine()
    result = engine.smart_search(query, top_k)
    return result["files_referenced"]


# =======================================================
# 5. MAIN (TESTING)
# =======================================================
if __name__ == "__main__":
    print("=== AI Search Engine Test (With File References) ===\n")
    
    engine = AISearchEngine()
    
    # Test 1: Keyword Search
    print("1. Keyword Search:")
    print("-" * 50)
    results = engine.keyword_search(["fibre", "tarif"], "Offres", 3)
    for r in results:
        print(f"   📄 File: {r['file_name'] or 'Unknown'}")
        print(f"      Page: {r['page_number'] or 'N/A'}")
        print(f"      Category: {r['category']}")
        print(f"      Source: {r['source'] or 'N/A'}")
        print(f"      Snippet: {r['snippet'][:80]}...")
        print()
    
    # Test 2: Smart Search
    print("\n2. Smart Search:")
    print("-" * 50)
    result = engine.smart_search("ما هي أسعار عروض الفايبر؟", top_k=5)
    print(f"   Query: {result['query']}")
    print(f"   Intent: {result['intent']['search_type']}")
    print(f"   Total Found: {result['total_found']} documents")
    print(f"\n   📁 Files Referenced ({len(result['files_referenced'])}):")
    for f in result['files_referenced']:
        print(f"      - {f['formatted']} ({f['result_count']} matches)")
    
    # Test 3: Agent Search
    print("\n\n3. Agent Search:")
    print("-" * 50)
    response = engine.agent_search("I need ADSL offers info")
    print(f"   Action: {response['action']}")
    print(f"   Message: {response['message']}")
    if "files_referenced" in response:
        print(f"\n   📁 Files Found:")
        for f in response['files_referenced']:
            print(f"      - {f['formatted']}")
    
    # Test 4: Search Files Only
    print("\n\n4. Search Files Only:")
    print("-" * 50)
    files = search_files("convention entreprise", top_k=5)
    for f in files:
        print(f"   📄 {f['file_name'] or f['source']}")
        print(f"      Type: {f['file_type'] or 'Unknown'}")
        print(f"      Category: {f['category']}")
        print(f"      Matches: {f['result_count']}")
        print()