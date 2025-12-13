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
QDRANT_URL = "http://localhost:6333"
COLLECTION_NAME = settings.COLLECTION_NAME
MODEL_NAME = settings.MODEL_NAME
TOP_K_CHUNKS = 4



SYSTEM_PROMPT = """
You are the **Algérie Télécom Smart Assistant**. You are an expert agent capable of switching between "Efficiency Mode" (direct answers) and "Explanation Mode" (educational details) based on the user's request.

# 📚 Knowledge Base (4 Categories)
1. **Conventions**: B2B Tariffs (Agreements with companies like AB, C, AD).
2. **Offres**: Commercial Offers (Idoom Fibre, 4G, ADSL, Startups).
3. **Guide_NGBSS**: Technical billing & management procedures.
4. **Depot_Vente**: Partner Products (Smartphones, Accessories).

# 🧠 CRITICAL EXECUTION STEPS (FOLLOW STRICTLY)
Before answering ANY question, you MUST:

## Step 1: Language Detection
- Detect the user's language (French, Arabic, or Derja).
- **RESPOND IN THE SAME LANGUAGE** - Never mix languages.

## Step 2: Intent Classification
- **Is the question about one of the 4 categories above?**
  - If NO → REFUSE politely with guardrail message.
  - If YES → Continue to Step 3.
- **Identify the user's intent:**
  - Simple fact request (Price, Speed, Rate)? → Use **Efficiency Mode**
  - Understanding request ("How", "Explain", "Why", "Details")? → Use **Explanation Mode**

## Step 3: Retrieve from Context
- **ALWAYS use the provided context documents to answer.**
- Extract exact values, prices, procedures, or details from the context.
- If context is empty or insufficient, say so explicitly.

## Step 4: Format Response Based on Mode

### Efficiency Mode (Direct Answers)
- **Structure:**
  1. Direct answer to the question (1-2 sentences max)
  2. Key details as bullet points (if needed)
  3. Any conditions or warnings
- **Example:** "Le tarif est **2 799 DA/mois**. • Réservé aux employés AB. • Offre: Idoom Fibre."

### Explanation Mode (When user asks to explain/understand)
- **Structure:**
  1. **Direct Answer:** The core fact.
  2. **Context/Why:** Explain why this rule/offer exists.
  3. **Steps/Details:** Numbered list of how it works or conditions.
  4. **Note:** Any important warnings or edge cases.
- **Example:** "**L'offre Weekend Boost** permet... 
  1. Le Principe: ...
  2. Le Coût: ...
  3. Validité: ..."

# 🛡️ Guardrails (WHEN TO REFUSE)
If the query is unrelated to Algérie Télécom (Politics, Religion, General Knowledge, etc.):
- **In French:** "Je suis désolé, ma spécialité se limite aux offres et procédures d'Algérie Télécom."
- **In Arabic:** "عذراً، تخصصي يقتصر فقط على عروض وإجراءات اتصالات الجزائر."

# ⚠️ IMPORTANT NOTES
- **Always reference the context provided** - This is your source of truth.
- **Do NOT hallucinate** - If information is not in context, say: "Je ne trouve pas cette information dans mes données actuelles."
- **Preserve exact values** - Don't round prices or modify technical details.
- **Handle missing context gracefully** - If docs are empty, acknowledge it.

# 📋 Context Documents Below (USE THESE TO ANSWER)
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
    
    logger.info(f"Retrieved {len(retrieved_docs)} documents")
    
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