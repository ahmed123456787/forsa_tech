from typing import Optional, List, Dict
from src.core.models import Chat
from src.core.chat_repository import ChatRepository
from src.core.database import chats_collection


class ChatService:
    def __init__(self, repository: ChatRepository):
        self.repository = repository
    
    def create_chat(self, question: Dict[str, Dict[str, str]], response: Dict[str, Dict[str, str]], reference_urls: Optional[List[str]] = None) -> Chat:
        """Create a new chat"""
        chat_data = {
            "question": question,
            "response": response,
            "reference_urls": reference_urls or []
        }
        return self.repository.create_chat(chat_data)
    
    def get_all_chats(self) -> List[Chat]:
        """Get all chats"""
        return self.repository.get_all_chats()
    
    def get_chat_by_id(self, chat_id: str) -> Optional[Chat]:
        """Get a specific chat by ID"""
        return self.repository.get_chat_by_id(chat_id)
    
    def update_chat_response(self, chat_id: str, new_response: Dict[str, Dict[str, str]]) -> bool:
        """Update chat response"""
        return self.repository.update_chat(chat_id, {"response": new_response})
    
    def update_chat_reference_urls(self, chat_id: str, reference_urls: List[str]) -> bool:
        """Update chat reference URLs"""
        return self.repository.update_chat(chat_id, {"reference_urls": reference_urls})
    
    def add_reference_url_to_chat(self, chat_id: str, new_url: str) -> bool:
        """Add a new reference URL to chat"""
        chat = self.get_chat_by_id(chat_id)
        if chat:
            current_urls = chat.reference_urls or []
            if new_url not in current_urls:
                current_urls.append(new_url)
                return self.repository.update_chat(chat_id, {"reference_urls": current_urls})
        return False
    
    def delete_chat(self, chat_id: str) -> bool:
        """Delete a chat"""
        return self.repository.delete_chat(chat_id)
    
    def search_chats_by_question(self, search_term: str) -> List[Chat]:
        """Search chats by question content"""
        # This is a simple text search - you might want to implement more sophisticated search
        query = {"question": {"$regex": search_term, "$options": "i"}}
        return self.repository.search_chats(query)


chat_service = ChatService(ChatRepository(collection=chats_collection))