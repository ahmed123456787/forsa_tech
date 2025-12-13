from typing import Optional, List, Dict
from pymongo.collection import Collection
from bson import ObjectId
from datetime import datetime
from src.core.models import Chat


class ChatRepository:
    def __init__(self, collection: Collection):
        self.collection = collection
    
    def create_chat(self, chat_data: Dict) -> Chat:
        """Create a new chat"""
        chat_data['timestamp'] = datetime.utcnow()
        result = self.collection.insert_one(chat_data)
        chat_data['id'] = str(result.inserted_id)
        return Chat(**chat_data)
    
    def get_all_chats(self) -> List[Chat]:
        """Get all chats"""
        chats = []
        for chat_doc in self.collection.find():
            chat_doc['id'] = str(chat_doc['_id'])
            del chat_doc['_id']
            chats.append(Chat(**chat_doc))
        return chats
    
    def get_chat_by_id(self, chat_id: str) -> Optional[Chat]:
        """Get a specific chat by ID"""
        try:
            chat_doc = self.collection.find_one({"_id": ObjectId(chat_id)})
            if chat_doc:
                chat_doc['id'] = str(chat_doc['_id'])
                del chat_doc['_id']
                return Chat(**chat_doc)
            return None
        except Exception:
            return None
    
    def update_chat(self, chat_id: str, update_data: Dict) -> bool:
        """Update a chat"""
        try:
            update_data['timestamp'] = datetime.utcnow()
            result = self.collection.update_one(
                {"_id": ObjectId(chat_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception:
            return False
    
    def delete_chat(self, chat_id: str) -> bool:
        """Delete a chat"""
        try:
            result = self.collection.delete_one({"_id": ObjectId(chat_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    def search_chats(self, query: Dict) -> List[Chat]:
        """Search chats based on query"""
        chats = []
        for chat_doc in self.collection.find(query):
            chat_doc['id'] = str(chat_doc['_id'])
            del chat_doc['_id']
            chats.append(Chat(**chat_doc))
        return chats