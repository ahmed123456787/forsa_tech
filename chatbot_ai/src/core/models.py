from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from bson import ObjectId


class Chat(BaseModel):
    id: Optional[str] = None
    question: Dict[str, Dict[str, str]] = Field(..., description="Question structure with categories")
    response: Dict[str, Dict[str, str]] = Field(..., description="Response structure with offers")
    reference_urls: Optional[List[str]] = Field(default=None, max_items=10)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True  # For ObjectId
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }