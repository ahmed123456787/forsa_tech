from typing import List, Dict, Optional
from collections import Counter
import re
from datetime import datetime, timedelta


class QuestionRecommendationService:
    """Service to recommend questions based on chat history."""
    
    def __init__(self, chat_repository):
        self.chat_repository = chat_repository
    
    def _extract_question_text(self, question_dict: Dict) -> str:
        """Extract plain text from question structure."""
        for category, content in question_dict.items():
            if isinstance(content, dict) and "text" in content:
                return content["text"]
            elif isinstance(content, str):
                return content
        return str(question_dict)
    
    def _tokenize(self, text: str) -> set:
        """Simple tokenization for similarity matching."""
        words = re.findall(r'\b\w+\b', text.lower())
        stopwords = {'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'pour', 'que', 'qui', 'dans', 'ce', 'il', 'je', 'a', 'Ã '}
        return set(w for w in words if w not in stopwords and len(w) > 2)
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate Jaccard similarity between two texts."""
        tokens1 = self._tokenize(text1)
        tokens2 = self._tokenize(text2)
        if not tokens1 or not tokens2:
            return 0.0
        intersection = len(tokens1 & tokens2)
        union = len(tokens1 | tokens2)
        return intersection / union if union > 0 else 0.0
    
    async def get_popular_questions(self, limit: int = 5) -> List[Dict]:
        """Get most frequently asked questions."""
        chats = await self.chat_repository.get_all_chats()
        
        question_counts = Counter()
        question_map = {}
        
        for chat in chats:
            q_text = self._extract_question_text(chat.question)
            question_counts[q_text] += 1
            question_map[q_text] = chat.question
        
        popular = []
        for q_text, count in question_counts.most_common(limit):
            popular.append({
                "question": q_text,
                "count": count,
                "original_structure": question_map[q_text]
            })
        
        return popular
    
    async def get_similar_questions(self, current_question: str, limit: int = 5) -> List[Dict]:
        """Find similar questions from history."""
        chats = await self.chat_repository.get_all_chats()
        
        similarities = []
        seen = set()
        
        for chat in chats:
            q_text = self._extract_question_text(chat.question)
            if q_text in seen or q_text.lower() == current_question.lower():
                continue
            seen.add(q_text)
            
            score = self._calculate_similarity(current_question, q_text)
            if score > 0.1:  # Minimum threshold
                similarities.append({
                    "question": q_text,
                    "similarity_score": round(score, 3),
                    "original_structure": chat.question
                })
        
        similarities.sort(key=lambda x: x["similarity_score"], reverse=True)
        return similarities[:limit]
    
    async def get_recent_questions(self, days: int = 7, limit: int = 5) -> List[Dict]:
        """Get unique recent questions."""
        chats = await self.chat_repository.get_all_chats()
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        recent = []
        seen = set()
        
        for chat in sorted(chats, key=lambda x: x.timestamp, reverse=True):
            if chat.timestamp < cutoff:
                continue
            q_text = self._extract_question_text(chat.question)
            if q_text not in seen:
                seen.add(q_text)
                recent.append({
                    "question": q_text,
                    "timestamp": chat.timestamp.isoformat()
                })
            if len(recent) >= limit:
                break
        
        return recent
    
    async def get_recommendations(
        self, 
        current_question: Optional[str] = None,
        limit: int = 5
    ) -> Dict:
        """Get all recommendation types."""
        result = {
            "popular": await self.get_popular_questions(limit),
            "recent": await self.get_recent_questions(limit=limit)
        }
        
        if current_question:
            result["similar"] = await self.get_similar_questions(current_question, limit)
        
        return result