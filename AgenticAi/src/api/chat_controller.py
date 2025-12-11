from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from fastapi import HTTPException
import time 
from src.core.chat_service import chat_service
from src.core.schemas import ChatRequest, ChatResponse


router = APIRouter()


def simulated_chat_generator(full_response: str):
    """
    A generator that yields chunks of the response formatted for SSE.
    """
    for chunk in full_response.split(' '):
        # 1. Simulate the time delay (e.g., waiting for the AI model)
        time.sleep(0.1)
        
        # 2. Format the chunk for SSE: 'data: [content]\n\n'
        # The frontend uses the 'data:' prefix to read the message.
        yield f"data: {chunk}\n\n"


@router.post("/chats/", response_model=ChatResponse)
async def create_chat_response(chat_data: ChatRequest):
    """
    Endpoint that creates a chat with structured question data
    """
    try:
        
        # Build response in the expected format
        categorie = next(iter(chat_data.question.keys())) if chat_data.question else "categorie_01"
        questions_map = chat_data.question.get(categorie, {})
        
        # Generate responses for each question
        reponses_map = {}
        for k, v in questions_map.items():
            if k == "1":
                reponses_map[k] = "Le projet vise à développer une solution innovante…"
            elif k == "2":
                reponses_map[k] = "Les technologies utilisées incluent Python, FastAPI, et un modèle IA…"
            else:
                reponses_map[k] = f"Réponse pour la question: {v}"
        
        # Prepare response structure
        response_data = {"Offre_01": reponses_map}
        
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