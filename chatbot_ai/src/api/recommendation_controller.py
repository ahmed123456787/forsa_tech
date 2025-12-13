from fastapi import APIRouter, Query, Depends
from typing import Optional
from src.core.question_recommandation import QuestionRecommendationService
from src.core.chat_repository import ChatRepository
from src.core.database import chats_collection

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def get_recommendation_service():
    chat_repo = ChatRepository(chats_collection)
    return QuestionRecommendationService(chat_repo)


@router.get("/")
async def get_recommendations(
    current_question: Optional[str] = Query(None, description="Current question for similarity matching"),
    limit: int = Query(5, ge=1, le=20),
    service: QuestionRecommendationService = Depends(get_recommendation_service)
):
    """Get question recommendations based on chat history."""
    return await service.get_recommendations(current_question, limit)


@router.get("/popular")
async def get_popular_questions(
    limit: int = Query(5, ge=1, le=20),
    service: QuestionRecommendationService = Depends(get_recommendation_service)
):
    """Get most frequently asked questions."""
    return await service.get_popular_questions(limit)


@router.get("/similar")
async def get_similar_questions(
    question: str = Query(..., description="Question to find similar ones"),
    limit: int = Query(5, ge=1, le=20),
    service: QuestionRecommendationService = Depends(get_recommendation_service)
):
    """Find questions similar to the given one."""
    return await service.get_similar_questions(question, limit)


@router.get("/recent")
async def get_recent_questions(
    days: int = Query(7, ge=1, le=30),
    limit: int = Query(5, ge=1, le=20),
    service: QuestionRecommendationService = Depends(get_recommendation_service)
):
    """Get recently asked questions."""
    return await service.get_recent_questions(days, limit)