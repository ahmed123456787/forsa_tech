from langchain_openai import ChatOpenAI
from langchain_community.embeddings import JinaEmbeddings
from langchain_community.vectorstores import Qdrant
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from qdrant_client import QdrantClient
from src.rag_core.retrieval import VectorSearcher
from src.core.settings import settings
import logging
from difflib import SequenceMatcher
import logging



logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# =======================================================
# 1. CONFIGURATION GLOBALE
# =======================================================

DEEPSEEK_API_KEY = "01Gu-xIiEQJWwuikkIdaPSSViTJLBpiUN9erLplVzCDJPErt8Qz8EcQ_t3YtzerzjpZ1wTNqof74JIYOfGBrqA"
DEEPSEEK_BASE_URL = "https://api.modelarts-maas.com/v2"
DEEPSEEK_MODEL = "deepseek-v3.1"
JINA_API_KEY = settings.JINA_API_KEY
QDRANT_URL = settings.Qdrant_URL
COLLECTION_NAME = settings.COLLECTION_NAME
MODEL_NAME = settings.MODEL_NAME
TOP_K_CHUNKS = 4



SYSTEM_PROMPT = """
You are the **Algérie Télécom Smart Assistant**.

# 📚 Knowledge Base (4 Categories)
1. **Conventions**: B2B Tariffs
2. **Offres**: Commercial Offers (Idoom Fibre, 4G, ADSL)
3. **Guide_NGBSS**: Technical & billing procedures
4. **Depot_Vente**: Partner Products (Phones, Accessories)

# 🧠 EXECUTION STEPS
## Step 1: Language Detection
- Detect language (French, Arabic, Darija, or mixed).
- **RESPOND IN THE DETECTED LANGUAGE**.
- Code-switching is acceptable (e.g., "شحال مدة الضمان لهواتف ZTE؟").

## Step 2: Intent Classification
- Is this about Algérie Télécom? If NO → REFUSE politely.
- Simple fact (price, speed, rate)? → Use **Efficiency Mode** (short answer).
- Explain/understand? → Use **Explanation Mode** (detailed answer).

## Step 3: Retrieve from Context
- Use the provided context documents ONLY.
- Extract exact values, prices, procedures.
- If missing: "Je ne trouve pas cette information."

## Step 4: Response Format

### Efficiency Mode (Default - SHORT ANSWERS)
- Direct answer (1-2 sentences max)
- Key bullet points only
- Example: "**2 799 DA/mois**. • Employés AB only. • Idoom Fibre."

### Explanation Mode (Only when asked to explain)
- Direct answer
- Why it exists
- Steps/conditions (numbered list, keep it brief)
- Important warnings only

# 🛡️ REFUSE IF
- Unrelated to Algérie Télécom (Politics, Religion, General Knowledge)
- **French:** "Je suis désolé, ma spécialité se limite aux offres d'Algérie Télécom."
- **Arabic/Darija:** "عذراً، تخصصي يقتصر فقط على عروض اتصالات الجزائر."

# ⚠️ KEY RULES
- **Always use context** - Never hallucinate.
- **Keep answers SHORT and direct** - No unnecessary details.
- **Preserve exact values** - Don't round prices.
- **Multilingual input is normal** - Handle naturally.

# 📋 Context Documents (YOUR SOURCE OF TRUTH)
{context}
"""


# =======================================================
# 2. INITIALISATION DES COMPOSANTS
# =======================================================
print("--- Démarrage de l'initialisation du RAG avec LangChain ---")

# A. Embedder Jina
jina_embeddings = JinaEmbeddings(
    jina_api_key=JINA_API_KEY,
    model_name=MODEL_NAME
)

# B. VectorDB Qdrant
qdrant_client = QdrantClient(
    url=QDRANT_URL,
)

qdrant_db = Qdrant(
    client=qdrant_client,
    collection_name=COLLECTION_NAME,
    embeddings=jina_embeddings,
)

# Use VectorSearcher for retrieval
searcher = VectorSearcher(collection_name=COLLECTION_NAME)

# C. LLM DeepSeek (with streaming enabled)
llm = ChatOpenAI(
    model=DEEPSEEK_MODEL,
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
    temperature=0.0,
    streaming=True  # Enable streaming
)

# D. Prompt Template
prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{input}")
])


# E. RAG Chain
question_answer_chain = create_stuff_documents_chain(llm, prompt)





# =======================================================
# 1. CONFIGURATION GLOBALE
# =======================================================
VALID_CATEGORIES = ["Convention", "Offres", "Guide_NGBSS", "Depot_Vente"]



# =======================================================
# 2. HELPER FUNCTION FOR FUZZY MATCHING
# =======================================================
def fuzzy_match_category(user_input: str, threshold: float = 0.6) -> tuple[str | None, float]:
    """
    Match user input to valid category using fuzzy matching.
    
    Args:
        user_input: User's category input (may contain typos).
        threshold: Similarity threshold (0-1, default 0.6).
        
    Returns:
        Tuple of (matched_category, confidence_score) or (None, 0) if no match.
    """
    user_input_lower = user_input.lower().strip()
    best_match = None
    best_ratio = 0
    
    for valid_category in VALID_CATEGORIES:
        ratio = SequenceMatcher(None, user_input_lower, valid_category.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = valid_category
    
    if best_ratio >= threshold:
        logger.info(f"✓ Fuzzy match: '{user_input}' -> '{best_match}' (confidence: {best_ratio:.1%})")
        return best_match, best_ratio
    
    logger.warning(f"✗ No fuzzy match found for category: '{user_input}' (best match was {best_ratio:.1%})")
    return None, best_ratio


# =======================================================
# 3. FONCTION DE REQUÊTE AVEC FUZZY MATCHING
# =======================================================
def ask_question_stream(question: str, category_id: str):
    """
    Ask a question to the LangChain RAG chain with streaming response.
    Applies fuzzy matching to handle typos in category_id.
    Yields chunks of text as they arrive.
    """
    # 1. Apply fuzzy matching to category
    matched_category, confidence = fuzzy_match_category(category_id, threshold=0.6)
    
    if matched_category:
        logger.info(f"Using matched category: {matched_category}")
        category_id = matched_category
        filters = {"ID_categorie": category_id}
    else:
        logger.warning(f"No valid category match for '{category_id}'. Searching without category filter.")
        filters = None  # Search without category filter
    
    # 2. Retrieve documents using VectorSearcher
    retrieved_docs = searcher.similarity_search(
        query=question,
        k=TOP_K_CHUNKS,
        metadata_filters=filters
    )
    
    logger.info(f"Retrieved {(retrieved_docs)} documents")
    
    # 3. Stream the chain response
    for chunk in question_answer_chain.stream({
        "input": question,
        "context": retrieved_docs
    }):
        yield chunk


def ask_question(question: str, category_id: str) -> str:
    """
    Ask a question to the LangChain RAG chain (non-streaming version).
    Applies fuzzy matching to handle typos in category_id.
    """
    # 1. Apply fuzzy matching to category
    matched_category, confidence = fuzzy_match_category(category_id, threshold=0.6)
    
    if matched_category:
        logger.info(f"Using matched category: {matched_category}")
        category_id = matched_category
        filters = {"ID_categorie": category_id}
    else:
        logger.warning(f"No valid category match for '{category_id}'. Searching without category filter.")
        filters = None  # Search without category filter
    
    logger.info(f"Category ID: {category_id}")
    
    # 2. Retrieve documents using VectorSearcher
    retrieved_docs = searcher.similarity_search(
        query=question,
        k=TOP_K_CHUNKS,
        metadata_filters=filters
    )

    # test if the question is in the wrong category.
    if len(retrieved_docs) == 0 and category_id in VALID_CATEGORIES:
        retrieved_docs = searcher.similarity_search(
            query=question,
            k=TOP_K_CHUNKS,
            metadata_filters=None
        )
    
    logger.info(f"Retrieved {len(retrieved_docs)} documents for question: {question}")
    
    # 3. Invoke the chain with the retrieved documents
    response = question_answer_chain.invoke({
        "input": question,
        "context": retrieved_docs
    })
    
    return response


# =======================================================
# 4. EXÉCUTION
# =======================================================
if __name__ == "__main__":
    import time
    import json
    
    # Test with various category inputs (including typos)
    USER_INPUT = {
        "equipe": "RAG_Benchmark_Team",
        "question": {
            "Offres": {
                "Q50": "ما هو سعر عرض 1 جيجابت في الثانية للمؤسسة أ؟"
            },
            "convent": {  # Typo: should match "Conventions"
                "Q51": "ما هو سعر الاتفاقية AB؟"
            },
            "guide": {  # Typo: should match "Guide_NGBSS"
                "Q52": "كيفاش نسجل فاتورة تكميلية؟"
            },
            "Unknown_Category": {  # Invalid category: search without filter
                "Q53": "معلومات عامة عن الخدمات"
            }
        }
    }
    
    print("--- Démarrage du traitement des questions ---")
    print(f"Équipe: {USER_INPUT['equipe']}\n")
    
    output_data = {
        "equipe": USER_INPUT["equipe"],
        "question": {}
    }
    
    try:
        for category_id, questions in USER_INPUT["question"].items():
            output_data["question"][category_id] = {}
            print(f"\n[Catégorie: {category_id}]")
            
            for question_id, question_text in questions.items():
                print(f"  - Question '{question_id}': \"{question_text}\"")
                start_time = time.time()
                
                print("  -> Réponse: ", end="", flush=True)
                full_answer = ""
                for chunk in ask_question_stream(question_text, category_id):
                    print(chunk, end="", flush=True)
                    full_answer += chunk
                print()
                
                end_time = time.time()
                elapsed_time = end_time - start_time
                
                output_data["question"][category_id][question_id] = full_answer
                print(f"  -> Réponse reçue en {elapsed_time:.2f}s\n")
        
        print("\n--- RÉSULTATS COMPLETS ---")
        
    except Exception as e:
        print(f"\n!!! ERREUR: {e}")
        import traceback
        traceback.print_exc()