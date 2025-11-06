import { useState } from "react";
import { uploadCSV } from "../uploadCSV";

function UploadDataset({ userId, afterUpload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);

    try {
      // 1) upload to Supabase
      const fileUrl = await uploadCSV(file, userId);

      // 2) make dataset in DB
      const res = await fetch("https://klyra-e6ui.onrender.com/dataset/add", {
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

      // 3) process embeddings
      await fetch(
        `https://klyra-e6ui.onrender.com/dataset/process/${data.data._id}`,
        { method: "POST" }
      );

      alert("Uploaded & processed successfully ");

      // reload list
      if (afterUpload) afterUpload();

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