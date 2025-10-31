from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from datetime import datetime , UTC


app = FastAPI()

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

