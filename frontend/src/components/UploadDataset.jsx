import { useState } from "react";
import { uploadCSV } from "../uploadCSV";

function UploadDataset({ userId }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);

    try {
      // 1) UPLOAD FILE TO SUPABASE
      const fileUrl = await uploadCSV(file, userId);

      // 2) SAVE DATASET RECORD IN MONGO VIA FASTAPI
      const res = await fetch("http://localhost:8000/dataset/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          file_name: file.name,
          file_url: fileUrl
        })
      });

      const data = await res.json();
      console.log("dataset added:", data);
      alert("Uploaded Successfully ");
      
    } catch (err) {
      console.log(err);
      alert("Upload failed ");
    }

    setLoading(false);
  }

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Dataset"}
      </button>
    </div>
  );
}

export default UploadDataset;