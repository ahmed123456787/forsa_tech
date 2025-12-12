from langchain_openai import ChatOpenAI
from langchain_community.embeddings import JinaEmbeddings
from langchain_community.vectorstores import Qdrant
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from qdrant_client import QdrantClient
from src.rag_core.retrieval import VectorSearcher
from src.core.settings import settings


# =======================================================
#               1. CONFIGURATION GLOBALE
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
Answer the user's question based on the following context.
If the context doesn't contain the answer, state that you don't have enough information.

Context:
{context}
"""

# =======================================================
#               2. INITIALISATION DES COMPOSANTS
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


# C. LLM DeepSeek
llm = ChatOpenAI(
    model=DEEPSEEK_MODEL,
    api_key=DEEPSEEK_API_KEY,
    base_url=DEEPSEEK_BASE_URL,
    temperature=0.0
)

# D. Prompt Template
prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "{input}")
])

# E. RAG Chain
question_answer_chain = create_stuff_documents_chain(llm, prompt)


print("✓ RAG Chain LangChain initialisée.")
print(f"✓ Collection: {COLLECTION_NAME}")
print(f"✓ Top-K: {TOP_K_CHUNKS}")
print("-------------------------------------------------------------------")


# =======================================================
#               3. FONCTION DE REQUÊTE
# =================================I======================

def ask_question(question: str) -> str:
    """
    Ask a question to the LangChain RAG chain.
    """
    # 1. Retrieve documents using VectorSearcher
    retrieved_docs = searcher.similarity_search(query=question, k=TOP_K_CHUNKS)
    
    # 2. Invoke the chain with the retrieved documents
    response = question_answer_chain.invoke({
        "input": question,
        "context": retrieved_docs
    })
    return response

# =======================================================
#               4. EXÉCUTION
# =======================================================

if __name__ == "__main__":
    USER_QUESTION = "est ce que vous pouvez donner des exemples sur des conventions?"

    print(f"Question: '{USER_QUESTION}'")

    try:
        answer = ask_question(USER_QUESTION)

        print("\n=======================================================")
        print("              RÉSULTAT DU RAG (DEEPSEEK)               ")
        print("=======================================================")
        print(f"Modèle LLM: {DEEPSEEK_MODEL}")
        print(f"\n>>> RÉPONSE:\n{answer}")

    except Exception as e:
        print(f"\n!!! ERREUR: {e}")
        import traceback
        traceback.print_exc()