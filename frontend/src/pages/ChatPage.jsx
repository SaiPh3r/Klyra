import { useParams } from "react-router-dom"
import { useEffect , useState } from "react"
const ChatPage = () => {
    const {datasetId} = useParams();
    console.log(datasetId);


  return (
    <div>ChatPage</div>
  )
}

export default ChatPage