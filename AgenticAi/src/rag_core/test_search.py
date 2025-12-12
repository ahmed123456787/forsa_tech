from src.rag_core.retrieval import VectorSearcher

# Initialize the searcher
searcher = VectorSearcher(collection_name="forsa_knowledge_semantic_chunk")

# Basic similarity search
query = "comment creeer abonnement idom fibre"
basic_results = searcher.similarity_search_with_score(query, k=1)
print(f"Found {len(basic_results)} documents")
print(basic_results)
