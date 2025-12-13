from pymongo import MongoClient
from src.core.settings import settings


# Establish Connection
client = MongoClient(settings.DATABASE_URL)



# Select Database and Collection
db = client["forsa"] 
chats_collection = db["chats"] 
