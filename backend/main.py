from fastapi import FastAPI , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db import client
from pydantic import BaseModel
import os
from datetime import datetime , UTC
from bson.objectid import ObjectId
import requests
from dotenv import load_dotenv
load_dotenv()
from langchain_google_genai import GoogleGenerativeAIEmbeddings , ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

import csv
import pandas as pd
import io


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

class Ask(BaseModel):
       dataset_id:str
       question:str

class AnalyticsRequest(BaseModel):
    dataset_id: str
    csv_url: str
    x_column: str
    y_column: str
    aggregation: str  # sum, avg, count, min, max
    chart_type: str   # bar, line, scatter, pie
    title: str = ""
    color_scheme: str = "viridis"

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

@app.post("/analytics/generate-chart")
def generate_chart(data: AnalyticsRequest):
    """
    Generate chart-ready analytics data from CSV.
    Accepts column selections, aggregation, and chart type.
    Returns labels and values for Plotly visualization.
    """
    try:
        # Fetch CSV from URL
        csv_resp = requests.get(data.csv_url)
        csv_resp.raise_for_status()
        
        # Load into pandas
        df = pd.read_csv(io.StringIO(csv_resp.text))
        
        # Validate columns exist
        if data.x_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{data.x_column}' not found")
        if data.y_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{data.y_column}' not found")
        
        # Group by X axis and apply aggregation
        aggregation_funcs = {
            "sum": "sum",
            "avg": "mean",
            "count": "count",
            "min": "min",
            "max": "max"
        }
        
        agg_func = aggregation_funcs.get(data.aggregation, "sum")
        
        # Perform groupby aggregation
        grouped = df.groupby(data.x_column)[data.y_column].agg(agg_func).reset_index()
        grouped.columns = ["label", "value"]
        
        # Convert to JSON-friendly format
        labels = grouped["label"].astype(str).tolist()
        values = grouped["value"].astype(float).tolist()
        
        return {
            "success": True,
            "chart_data": {
                "labels": labels,
                "values": values,
                "title": data.title or f"{data.aggregation.capitalize()} of {data.y_column} by {data.x_column}",
                "x_axis": data.x_column,
                "y_axis": data.y_column,
                "aggregation": data.aggregation,
                "chart_type": data.chart_type
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating chart: {str(e)}")
    
@app.post("/analytics/preview-columns")
def preview_columns(data: AnalyticsRequest):
    """
    Get available columns from CSV for UI dropdown.
    Returns columns with their data types.
    """
    try:
        csv_resp = requests.get(data.csv_url)
        csv_resp.raise_for_status()
        
        df = pd.read_csv(io.StringIO(csv_resp.text))
        
        # Determine column types
        columns_info = []
        for col in df.columns:
            dtype = "numeric" if pd.api.types.is_numeric_dtype(df[col]) else "text"
            columns_info.append({"name": col, "type": dtype})
        
        return {
            "success": True,
            "columns": columns_info,
            "rows": len(df),
            "sample": df.head(3).values.tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")
    
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
        


        return {"message": "message added", "user_msg": msg }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/dataset/process/{dataset_id}")
def process_dataset(dataset_id:str):
    model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", api_key=os.getenv("GOOGLE_API_KEY"))
    ds = datasets_collection.find_one({"_id": ObjectId(dataset_id)})
    if not ds:
        raise HTTPException(status_code=404, detail="dataset not found")
    
    file_url = ds["file_url"]

    try:
        csv_resp = requests.get(file_url)
        csv_resp.raise_for_status()
    
    except:
        raise HTTPException(status_code=500, detail="failed to fetch CSV")
    
    data_lines = csv_resp.text.splitlines()
    reader = csv.reader(data_lines)
    rows = list(reader)

    if len(rows) <= 1:
        raise HTTPException(status_code=400, detail="CSV is empty or has no rows")

    # drop header
    header = rows[0] 
    rows = rows[1:]

    #header
    header_text = "SUMMARY of dataset columns: " + ", ".join(header) + ". This describes what this dataset is ABOUT."
    header_emb = model.embed_documents([header_text])[0]

    row_texts = [
    " | ".join([f"{header[i]}={r[i]}" for i in range(len(r))])
    for r in rows
]

    # row wise text chunks
    embeddings = model.embed_documents(row_texts)

    # build row objects
    chunk_docs = [
        {"dataset_id": dataset_id, "text": row_texts[i], "embedding": embeddings[i]}
        for i in range(len(row_texts))
    ]

    # delete old chunks if any
    embeddings_collection.delete_many({"dataset_id": dataset_id})

    embeddings_collection.insert_one({
    "dataset_id": dataset_id,
    "text": header_text,
    "embedding": header_emb
})


    # insert many separate docs
    embeddings_collection.insert_many(chunk_docs)


    return {"message": "embeddings created", "rows": len(chunk_docs)}

@app.get("/debug/count/{dataset_id}")
def debug_count(dataset_id: str):
    count = embeddings_collection.count_documents({"dataset_id": dataset_id})
    return {"dataset_id": dataset_id, "count": count}

@app.get("/debug/one/{dataset_id}")
def debug_one(dataset_id: str):
    doc = embeddings_collection.find_one({"dataset_id": dataset_id})
    if not doc:
        return {"msg":"no"}
    return {"len": len(doc["embedding"])}


def cosine(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    normA = (sum(x*x for x in a)) ** 0.5
    normB = (sum(x*x for x in b)) ** 0.5
    return dot / (normA * normB)

@app.post("/chat/answer")
def answer(data:Ask):
    # 1) embed question
    model = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004", api_key=os.getenv("GOOGLE_API_KEY"))
    q_emb = model.embed_documents([data.question])[0]

    # 2) find dataset chunks & score
    chunks = embeddings_collection.find({"dataset_id": data.dataset_id})
    scored = []
    for c in chunks:
        emb = [float(x) for x in c["embedding"]]
        score = cosine(q_emb, emb)
        scored.append((score, c["text"]))

    scored.sort(reverse=True)
    top20 = [s[1] for s in scored[:20]]
    context = "\n".join(top20)

    # 3) get ALL chat history
    chat_doc = chat_collection.find_one({"dataset_id": data.dataset_id})
    history = ""
    if chat_doc and "messages" in chat_doc:
        history = "\n".join([f"{m['sender']}: {m['message']}" for m in chat_doc["messages"]])

    # 4) build prompt
    template = """You are a data analysis assistaldnt.

Use ONLY the dataset rows and chat history below.

CHAT HISTORY:
{history}

DATA ROWS:
{context}

QUESTION:
{question}

Rules:
- your answer MUST come strictly from dataset rows
- chat history is ONLY to understand the user's intent, NOT to invent data
- do NOT use any knowledge outside dataset.
- If the dataset rows do not include a direct answer, infer based on column names if possible.

If question is about what dataset contains, summarise it using column names. 
Give a short precise answer:"""

    prompt = PromptTemplate.from_template(template)
    llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))

    final_prompt = prompt.format(context=context, question=data.question, history=history)
    resp = llm.invoke(final_prompt)
    answer_text = resp.content

    # 5) SAVE AI reply back into chat DB
    ai_msg = {
        "sender": "ai",
        "message": answer_text,
        "timestamp": datetime.now(UTC)
    }

    chat_collection.update_one(
        {"dataset_id": data.dataset_id},
        {"$push": {"messages": ai_msg}}
    )

    return {"answer": answer_text}






