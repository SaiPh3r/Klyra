from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import client
from pydantic import BaseModel
import os
from datetime import datetime , UTC


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] for all origins (less secure)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# MongoDB setup
db = client[os.getenv("DB_NAME", "klyra_db")]
users_collection = db["users"]

class User(BaseModel):
    user_id : str
    name : str
    email: str

class Dataset(BaseModel):
    dataset_id : str
    user_id : str
    file_name : str
    file_url : str #url for the file where i will be stroing it (firebase abhi ke liye socha h)

class Chat(BaseModel):
    user_id: str
    dataset_id: str
    sender: str           # "user" or "ai"
    message: str
    timestamp: datetime = datetime.now(UTC)
    

@app.get("/")
def home():
    return {"message":"welcome to Klyra : "}

@app.post("/signup")
def handle_signup(user:User):
    existing_user = users_collection.find_one({"user_id": user.user_id})
    if(existing_user):
        return{"message":f"welcome back {existing_user['name']}"}
    else:
        try:
            users_collection.insert_one(user.model_dump())
            return {
                "message":f"new user {user.name} created successfuly"
            }
        except:
            raise HTTPException(status_code=500 , detail="error in creating user")
    

