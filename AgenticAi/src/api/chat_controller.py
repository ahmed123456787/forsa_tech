from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from fastapi import HTTPException
from src.core.schemas import StreamRequest
from src.core.chat_service import chat_service
from src.core.schemas import ChatRequest, ChatResponse
from src.rag_core.llm_generator import ask_question 
from src.rag_core.llm_generator import ask_question, ask_question_stream


router = APIRouter()


async def stream_generator(question: str, category_id: str):
    """
    A generator that calls the RAG core and yields SSE-formatted chunks.
    """
    try:
        for chunk in ask_question_stream(question=question, category_id=category_id):
            if chunk:
                yield f"data: {chunk}\n\n"
        
        yield "data: [DONE]\n\n"

    except Exception as e:
        error_message = f"Error streaming response: {str(e)}"
        yield f"data: {error_message}\n\n"



########################################################################################


@router.post("/stream-chat/")
async def stream_chat_response(stream_data: StreamRequest):
    """
    Endpoint that accepts a simple text question and streams the response.
    """
    return StreamingResponse(
        stream_generator(stream_data.question, stream_data.category_id),
        media_type="text/event-stream"
    )


########################################################################################


@router.post("/chats/", response_model=ChatResponse)
async def create_chat_response(chat_data: ChatRequest):
    """
    Endpoint that creates a chat with structured question data
    """
    try:
        
        # Build response in the expected format
        categorie = next(iter(chat_data.question.keys())) if chat_data.question else "categorie_01"
        questions_map = chat_data.question.get(categorie, {})
        
        # Generate responses for each question using the RAG core
        reponses_map = {}
        for question_id, question_text in questions_map.items():
            # Call the RAG function to get a response
            answer = ask_question(question=question_text, category_id=categorie)
            reponses_map[question_id] = answer
        
        # Prepare response structure
        response_data = {categorie: reponses_map}
        
        # Create chat directly
        chat_service.create_chat(
            question=chat_data.question,
            response=response_data,
            reference_urls=[]
        )
        
        return ChatResponse(
            equipe=chat_data.equipe,
            reponses=response_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


########################################################################################


@router.get("/chats/")
async def get_all_chats():
    """
    Get all chats
    """
    try:
        chats = chat_service.get_all_chats()
        return chats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chats: {str(e)}")



########################################################################################


@router.get("/chats/{chat_id}")
async def get_chat(chat_id: str):
    """
    Get a specific chat by ID
    """
    try:
        chat = chat_service.get_chat_by_id(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving chat: {str(e)}")


########################################################################################


@router.delete("/chats/{chat_id}")
async def delete_chat(chat_id: str):
    """
    Delete a specific chat by ID
    """
    try:
        deleted = chat_service.delete_chat(chat_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"message": "Chat deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting chat: {str(e)}")