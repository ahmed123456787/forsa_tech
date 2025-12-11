from pydantic import BaseModel, Field
from typing import Dict, Any, List
from typing import Optional







class ChatRequest(BaseModel):
    """Model for chat request data"""
    equipe: str
    question: Dict[str, Dict[str, str]]
    
    class Config:
        schema_extra = {
            "example": {
                "equipe": "IA_Team",
                "question": {
                    "categorie_01": {
                        "1": "Donnez une description du projet",
                        "2": "Quelles sont les technologies utilisées ?"
                    }
                }
            }
        }



class ChatResponse(BaseModel):
    """Model for chat response data"""
    equipe: str
    reponses: Dict[str, Dict[str, str]]
    
    class Config:
        schema_extra = {
            "example": {
                "equipe": "NomDeLEquipe",
                "reponses": {
                    "Nom de l'offre": {
                        "ID question": "Réponse"
                    }
                }
            }
        }



class SessionCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "name": "AI Development Session",
                "description": "Session for discussing AI development strategies"
            }
        }

class SessionUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Updated Session Name",
                "description": "Updated session description"
            }
        }

class SessionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    last_updated: str
    chats: List[dict] = []