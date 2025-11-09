import { useParams } from "react-router-dom"
import { useEffect , useState } from "react"
const ChatPage = () => {
    const {datasetId} = useParams();
    console.log(datasetId);
    const[messages , setMessages] = useState([]);
    const[question , setQuestion] = useState("");

    async function loadChat() {
        const res = await fetch(`https://klyra-e6ui.onrender.com/chat/${datasetId}`);
        const data = await res.json();
        console.log("chat loaded",data);

        setMessages(data.chat.messages ?? []);
    }
    
    async function askQuestion() {
        const res = await fetch('https://klyra-e6ui.onrender.com/chat/answer',{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                dataset_id:datasetId,
                question:question,
            })
        });
        const data = await res.json();
        console.log(data);
        // console.log("AI replied" , data)

        setQuestion("");
        loadChat();
    }

useEffect(() => {
    loadChat();
  }, []);


  return (
    <div className="min-h-screen bg-[#070708] text-white px-6 pt-28">
      <h1 className="text-3xl font-bold mb-6">Chat with Dataset</h1>

      <div className="space-y-3 mb-20">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl ${
              m.sender === "user" ? "bg-purple-600" : "bg-black/50"
            }`}
          >
            {m.sender}: {m.message}
          </div>
        ))}
      </div>

      <div className="fixed bottom-5 left-0 right-0 px-6 max-w-2xl mx-auto flex gap-2">
        <input
          className="flex-1 bg-black/30 border border-white/10 px-4 py-2 rounded-xl"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="ask something..."
        />
        <button
          onClick={askQuestion}
          className="px-4 py-2 bg-purple-600 rounded-xl"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatPage