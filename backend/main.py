from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import client
from pydantic import BaseModel
import os
from datetime import datetime , UTC
from bson.objectid import ObjectId
from sentence_transformers import SentenceTransformer
import pandas as pd
import requests
from io import StringIO

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# MongoDB setup
db = client[os.getenv("DB_NAME", "klyra_db")]
users_collection = db["users"]
datasets_collection = db["datasets"]
chat_collection = db["chats"]
embeddings_collection = db["embeddings"]

class User(BaseModel):
    user_id : str
    name : str
    email: str

class Dataset(BaseModel):
    user_id : str
    file_name : str
    file_url : str #url for the file where i will be stroing it 

class Chat(BaseModel):
    user_id: str
    dataset_id: str
    sender: str           # "user" or "ai"
    message: str
    timestamp: datetime = datetime.now(UTC)

class SendMessage(BaseModel):
    dataset_id:str
    sender:str
    message:str    

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
    
@app.post("/chat/send")
def send_message(data:SendMessage):
    try:
        msg ={
            "sender":data.sender,
            "message":data.message,
            "timestamp":datetime.now(UTC)
        }

        result = chat_collection.update_one(
            {"dataset_id": data.dataset_id},
            {"$push": {"messages": msg}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="chat not found")
        
        ai_msg = {
            "sender": "ai",
            "message": "Thanks! I'm processing your dataset... AI analysis coming soon ",
            "timestamp": datetime.now(UTC)
        }

        chat_collection.update_one(
            {"dataset_id": data.dataset_id},
            {"$push": {"messages": ai_msg}} 
        )

        return {"message": "message added", "user_msg": msg , "ai_msg":ai_msg}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/dataset/process/{dataset_id}")
def process_dataset(dataset_id:str):
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    ds = datasets_collection.find_one({"_id": ObjectId(dataset_id)})
    if not ds:
        raise HTTPException(status_code=404, detail="dataset not found")
    
    file_url = ds["file_url"]

    try:
        csv_resp = requests.get(file_url)
        csv_resp.raise_for_status()
    
    except:
        raise HTTPException(status_code=500, detail="failed to fetch CSV")
    
    df = pd.read_csv(StringIO(csv_resp.text))

    # row wise text chunks
    row_texts = df.astype(str).apply(lambda row: " | ".join(row.values), axis=1).tolist()
    # embeddings
    embeddings = model.encode(row_texts).tolist() 
    # store in mongodb
    chunk_docs = [
        {"text": row_texts[i], "embedding": embeddings[i]}
        for i in range(len(row_texts))
    ]

    embeddings_collection.insert_one({
        "dataset_id": dataset_id,
        "chunks": chunk_docs
    })

    return {"message": "embeddings created", "rows": len(chunk_docs)}


    


