from langchain_openai import ChatOpenAI
from langchain_community.embeddings import JinaEmbeddings
from langchain_community.vectorstores import Qdrant
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from qdrant_client import QdrantClient
from src.rag_core.retrieval import VectorSearcher
from src.core.settings import settings

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
Role
You are the Algérie Télécom Efficiency Agent. Your goal is to provide instant, short, and precise answers derived only from the provided documents.

Knowledge Base (4 Categories)
Conventions: B2B Tariffs & Eligibility.
Offres: Commercial Offers (Fibre, 4G, etc.).
Guide_NGBSS: Technical Billing Procedures.
Depot_Vente: Partner Products (Smartphones).

Core Instructions
Be Direct & Simple
No Small Talk: Skip "Hello", "Thank you for asking", or long introductions. Start directly with the answer.
Simplify: Use simple language. Explain complex terms only if asked.
Format: Use Bullet points and Bold text for key values (Prices, Dates, Steps) to make the answer skimmable.
Length: Keep answers under 3-4 sentences unless a procedure requires a list.

Strict Context Usage
Answer ONLY using the provided context chunks.
No Hallucinations: If the answer is not in the text, say: "Information unavailable in documents."

Language Mirroring (Auto-Detect)
User speaks French → Reply in Concise French.
User speaks Arabic → Reply in Concise Arabic.
Do not mix languages.

utput Sanitization
Do not include any markdown formatting in your final answer.
Specifically, remove all asterisks (`*`), backslashes (`\\`), and newline characters (`\\n`). The response must be a clean, single-line string unless a list is required.

Guardrails (Strict Refusal)
If the question is NOT about Algérie Télécom or the 4 categories, refuse immediately.
Refusal Message:
FR: "Hors sujet. Je réponds uniquement sur les offres et procédures Algérie Télécom."
AR: "خارج الموضوع. أجيب فقط على عروض وإجراءات اتصالات الجزائر."

Examples
User: "Prix offre 300 Mega convention AB ?"
Agent:
"Le tarif est de 2 799 DA/mois.
Condition: Employés de l'établissement AB."

User: "كيفاش ندير فليكسي فالسيستام؟"
Agent:
"للقيام بالتعبئة (Flexy) في نظام NGBSS:
اذهب إلى Service Clientèle.
اختر Vente de ressource.
أدخل رقم الزبون والمبلغ."

User: "What is the weather?"
Agent:
"Hors sujet. Je réponds uniquement sur les offres et procédures Algérie Télécom."

context :
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
# 3. FONCTION DE REQUÊTE AVEC STREAMING
# =======================================================
def ask_question_stream(question: str, category_id: str):
    """
    Ask a question to the LangChain RAG chain with streaming response.
    Yields chunks of text as they arrive.
    """
    # 1. Retrieve documents using VectorSearcher
    retrieved_docs = searcher.similarity_search(
        query=question,
        k=TOP_K_CHUNKS,
        metadata_filters={"ID_categorie": category_id}
    )
    
    # 2. Stream the chain response
    for chunk in question_answer_chain.stream({
        "input": question,
        "context": retrieved_docs
    }):
        yield chunk

def ask_question(question: str, category_id: str) -> str:
    """
    Ask a question to the LangChain RAG chain (non-streaming version).
    """
    # 1. Retrieve documents using VectorSearcher
    retrieved_docs = searcher.similarity_search(
        query=question,
        k=TOP_K_CHUNKS,
        metadata_filters={"ID_categorie": category_id}
    )
    
    # 2. Invoke the chain with the retrieved documents
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
    
    # Structured input data
    USER_INPUT =  {
      "equipe": "RAG_Benchmark_Team",
      "question": {
        "Offres": {
           "Q50":"ما هو سعر عرض 1 جيجابت في الثانية للمؤسسة أ؟"
            
        }
      }
    }
    print("--- Démarrage du traitement des questions ---")
    print(f"Équipe: {USER_INPUT['equipe']}")
    
    # Prepare the output structure
    output_data = {
        "equipe": USER_INPUT["equipe"],
        "question": {}
    }
    
    try:
        # Iterate over each category and its questions
        for category_id, questions in USER_INPUT["question"].items():
            output_data["question"][category_id] = {}
            print(f"\n[Catégorie: {category_id}]")
            
            for question_id, question_text in questions.items():
                print(f"  - Traitement de la question '{question_id}': \"{question_text}\"")
                start_time = time.time()
                
                # --- Using the streaming function ---
                print("  -> Réponse en streaming: ", end="", flush=True)
                full_answer = ""
                for chunk in ask_question_stream(question_text, category_id):
                    print(chunk, end="", flush=True)
                    full_answer += chunk
                print() # Newline after streaming is complete
                # ------------------------------------

                end_time = time.time()
                elapsed_time = end_time - start_time
                
                # Store results in the new format
                output_data["question"][category_id][question_id] = full_answer
                
                print(f"  -> Réponse complète reçue en {elapsed_time:.2f} secondes.")
        
        print("\n\n--- RÉSULTATS COMPLETS ---")
        # Print the final JSON output in the desired format
        
    except Exception as e:
        print(f"\n!!! ERREUR: {e}")
        import traceback
        traceback.print_exc()