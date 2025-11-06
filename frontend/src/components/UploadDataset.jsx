import { useState } from "react";
import { uploadCSV } from "../uploadCSV";

function UploadDataset({ userId, afterUpload }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;

    setLoading(true);

    try {
      const fileUrl = await uploadCSV(file, userId);

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
      await fetch(`https://klyra-e6ui.onrender.com/dataset/process/${data.data._id}`, {
        method: "POST"
      });

      console.log("data added succesfuly" , data)
      alert("Uploaded & processed successfully");

      if (afterUpload) afterUpload();

    } catch (err) {
      alert("Upload failed");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      <input
        type="file"
        id="csvInput"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
        className="hidden"
      />

      <label
        htmlFor="csvInput"
        className="
          w-full max-w-md text-center px-6 py-3
          bg-purple-600 hover:bg-purple-700
          cursor-pointer rounded-xl text-white font-medium transition
        "
      >
        Click here to choose your CSV
      </label>

      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="
            w-full max-w-md text-center px-6 py-3
            bg-gray-900 border border-white/20
            rounded-xl text-white disabled:opacity-40
          "
        >
          {loading ? "Uploading..." : "Upload Dataset"}
        </button>
      )}

    </div>
  );
}

export default UploadDataset;