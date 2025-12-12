from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.chat_controller import router as chat_router
from src.api.recommendation_controller import router as recommendation_router


app = FastAPI()
app.include_router(chat_router, prefix="/api")
app.include_router(recommendation_router, prefix="/api")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1",port=8000,reload=True)