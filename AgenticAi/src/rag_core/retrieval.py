import json
from typing import Dict, Any
from langchain_community.vectorstores import Qdrant
from langchain_core.documents import Document
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

# --- Importations LangChain ---
from langchain_experimental.text_splitter import SemanticChunker 
from langchain_community.embeddings import JinaEmbeddings

# --- Configuration (Vos paramètres) ---
JINA_API_KEY = "jina_f16687951f1449678e7e44a7805a664bZUOLa4P6NZ7XA99sh04sN7WEI6Lu"
QDRANT_URL = "https://f2607ebe-1e5e-4e7c-8904-c895259cac73.europe-west3-0.gcp.cloud.qdrant.io:6333"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LhBcDCBvCaYaKqHfJ13UU5OQSb69o-utGsuuHQHm-D8"
COLLECTION_NAME = "forsa_knowledge_semantic_chunk" 
MODEL_NAME = "jina-embeddings-v3" 

def create_langchain_knowledge_base_semantic(data_entry: Dict[str, Any]):
    """
    Crée une base de connaissance Qdrant en utilisant le Semantic Chunking
    et l'embedding Jina, en utilisant uniquement les classes LangChain pour l'indexation.
    """

    text_to_index = data_entry.pop("cleaned_text", "")
    
    if not text_to_index:
        print("Erreur: Le champ 'cleaned_text' est manquant ou vide.")
        return

    doc_metadata = {
        "ID_categorie": data_entry.get("category", "Autre_Non_Identifie"),
        "partner": data_entry.get("partner", "Inconnu"),
        "offer_type": data_entry.get("offer_type", "N/A"),
        "source_file": data_entry.get("source_file", "Fichier_Inconnu"),
        "summary": data_entry.get("summary", "Résumé non disponible.")
    }

    print(f"\n--- Démarrage de l'indexation SÉMANTIQUE pour {doc_metadata['source_file']} ---")
    
    # 1. Préparer le Document LangChain
    document = Document(
        page_content=text_to_index,
        metadata=doc_metadata
    )

    # 2. Configurer l'Embedder Jina
    jina_embedder = JinaEmbeddings(
        jina_api_key=JINA_API_KEY,
        model_name=MODEL_NAME
    )

    # 3. Configurer le Semantic Chunker
    splitter = SemanticChunker(
        embeddings=jina_embedder
    )
    
    # Diviser le document en chunks sémantiques
    print("Découpage sémantique en cours...")
    chunks = splitter.split_documents([document])
    
    print(f"Document divisé en {len(chunks)} chunks sémantiques.")

    # 4. Indexation dans Qdrant - SOLUTION: Approche en 2 étapes
    try:
       # Étape 1: Créer le client Qdrant directement
        qdrant_client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
        )
        
        # Étape 2: Vérifier si la collection existe, créer seulement si nécessaire
        collections = qdrant_client.get_collections().collections
        collection_exists = any(c.name == COLLECTION_NAME for c in collections)
        
        if not collection_exists:
            # Obtenir la dimension des embeddings Jina
            print("Détermination de la dimension des embeddings...")
            sample_embedding = jina_embedder.embed_query("test")
            embedding_dim = len(sample_embedding)
            print(f"Dimension des embeddings: {embedding_dim}")
            
            # Créer la collection avec les bons paramètres
            print(f"Création de la collection: {COLLECTION_NAME}")
            qdrant_client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=embedding_dim,
                    distance=Distance.COSINE
                )
            )
        else:
            print(f"Collection {COLLECTION_NAME} existe déjà, ajout des documents...")
        
        # Étape 3: Ajouter les documents à la collection existante
        vectorstore = Qdrant.from_documents(
            documents=chunks,
            embedding=jina_embedder,
            collection_name=COLLECTION_NAME,
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
            force_recreate=False  # Ne pas recréer la collection
        )
        
        print(f"\n✓ Indexation Sémantique réussie dans Qdrant Cloud: {COLLECTION_NAME}.")
        print(f"✓ {len(chunks)} chunks indexés avec succès.")
        
        # Vérification finale
        collection_info = qdrant_client.get_collection(COLLECTION_NAME)
        print(f"✓ Collection contient {collection_info.points_count} points au total.")
        
    except Exception as e:
        print(f"\n✗ Erreur fatale lors de l'indexation Qdrant: {e}")
        print("Vérifiez l'URL, l'API Key et le statut de votre collection Qdrant Cloud.")
        import traceback
        traceback.print_exc()

# --- TEST ---
if __name__ == '__main__':
    
    # Load all data from summaries.json
    summaries_path = "AgenticAi/data/summaries.json"
    
    with open(summaries_path, "r", encoding="utf-8") as f:
        summaries_data = json.load(f)
    
    print(f"Chargement de {len(summaries_data)} documents depuis summaries.json")
    
    # Process each entry
    for i, data_entry in enumerate(summaries_data, 1):
        print(f"\n{'='*60}")
        print(f"Traitement du document {i}/{len(summaries_data)}")
        print(f"{'='*60}")
        create_langchain_knowledge_base_semantic(data_entry.copy())  # Use .copy() to avoid modifying original
    
    print(f"\n{'='*60}")
    print(f"✓ Indexation terminée pour {len(summaries_data)} documents.")
    print(f"{'='*60}")