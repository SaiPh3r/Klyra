from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import client
from pydantic import BaseModel
import os
from datetime import datetime , UTC
from bson.objectid import ObjectId


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["*"] for all origins (less secure)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# MongoDB setup
db = client[os.getenv("DB_NAME", "klyra_db")]
users_collection = db["users"]
datasets_collection = db["datasets"]
chat_collection = db["chats"]

class User(BaseModel):
    user_id : str
    name : str
    email: str

class Dataset(BaseModel):
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
        
@app.post("/dataset/add")
def add_dataset(dataset: Dataset):
    new_data = {
        "user_id": dataset.user_id,
        "file_name": dataset.file_name,
        "file_url": dataset.file_url,
        "created_at": datetime.now(UTC)
    }
    
    try:
        result = datasets_collection.insert_one(new_data)
        new_data["_id"] = str(result.inserted_id)  

        chat_collection.insert_one({
            "user_id":dataset.user_id,
            "dataset_id":str(result.inserted_id),
            "messages":[],
        })

        return {"message": "Dataset saved successfully", "data": new_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/datasets/{user_id}")
def get_datasets(user_id:str):
    try:
        datasets = list(datasets_collection.find({"user_id":user_id}))
        for d in datasets:
            d["_id"] = str(d["_id"])
        return  {"datasets":datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/chat/{dataset_id}")
def get_chat(dataset_id:str):
    try:
        chat = chat_collection.find_one({"dataset_id":dataset_id})
        if not chat:
            raise HTTPException(status_code=404, detail="chat not found")
        
        chat["_id"] = str(chat["_id"])
        return {"chat":chat}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

