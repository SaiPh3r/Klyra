from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import client
from pydantic import BaseModel
import os
from datetime import datetime , UTC


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
        new_data["_id"] = str(result.inserted_id)  # <<< FIX

        return {"message": "Dataset saved successfully", "data": new_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

