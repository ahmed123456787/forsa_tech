from src.rag_core.retrieval import VectorSearcher
from src.rag_core.vector_db_manager import qdrant_client

def test_search():
    """Simple test without optimization."""
    try:
        # Initialize searcher
        searcher = VectorSearcher(collection_name="forsa_knowledge_semantic_chunk")
        
        # Basic similarity search
        query = "comment creeer abonnement idom fibre"
        
        print(f"Searching for: '{query}'")
        print("-" * 50)
        
        # Time the search
        import time
        start_time = time.time()
        
        basic_results = searcher.similarity_search_with_score(query, k=10, metadata_filters={
        "ID_categorie": "Convention",
    })
        
        elapsed_time = time.time() - start_time
        print(f"Search completed in {elapsed_time:.2f} seconds")
        
        # Display results
        print(f"\nFound {len(basic_results)} documents:")
        print("-" * 50)
        
        for i, (doc, score) in enumerate(basic_results):
            print(f"\nResult {i+1} (Score: {score:.4f}):")
            print(f"Content: {doc.page_content[:200]}...")
            print(f"Metadata: {doc.metadata}")
            
    except Exception as e:
        print(f"Error during search: {e}")
        import traceback
        traceback.print_exc()

def check_qdrant_health():
    """Check if Qdrant is accessible."""
    try:
        health = qdrant_client.collection_cluster_info("forsa_knowledge_semantic_chunk")
        print(f"Qdrant health: {health}")
        return True
    except Exception as e:
        print(f"Qdrant health check failed: {e}")
        return False

# # Main execution
if __name__ == "__main__":
    print("Testing Qdrant search...")
    test_search()
    
from qdrant_client import QdrantClient, models

#     client = QdrantClient(url="http://localhost:6333")

#     client.update_collection(
#         collection_name="forsa_knowledge_semantic_chunk",
#         vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE, on_disk=True),
#         quantization_config=models.ScalarQuantization(
#             scalar=models.ScalarQuantizationConfig(
#                 type=models.ScalarType.INT8,
#                 always_ram=True,
#             ),
#         ),
#     )
# # from src.rag_core.retrieval import VectorSearcher
# # from src.rag_core.vector_db_manager import qdrant_client
# # from qdrant_client import models
# # import time

