import { useUser , UserButton } from "@clerk/clerk-react";
import UploadDataset from "../components/UploadDataset";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function UploadPage() {
  const { user } = useUser();
  const [datasets, setDatasets] = useState([]);

  if (!user) return null;

  async function loadDatasets() {
    const res = await fetch(`https://klyra-e6ui.onrender.com/datasets/${user.id}`);
    const data = await res.json();
    console.log("datasets loaded", data);
    setDatasets(data.datasets);
  }

  useEffect(() => {
    loadDatasets();
  }, []);


  return (
    <div className="min-h-screen bg-[#070708] text-white px-6 pt-32">

      <div className="max-w-2xl mx-auto text-center mb-14">
        <h1 className="text-4xl font-bold mb-3">Upload Dataset</h1>
        <UserButton/>
        <p className="text-gray-400">
          Upload CSV to analyse your data instantly
        </p>
      </div>

      <div className="max-w-xl mx-auto bg-black/30 border border-white/10 rounded-2xl p-8 backdrop-blur-lg mb-16">
        <UploadDataset userId={user.id} afterUpload={loadDatasets} />
      </div>

      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Your Uploaded Files</h2>

        <div className="space-y-3">
          {datasets.map((d) => (
            <div
              key={d._id}
              className="bg-black/20 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-black/40 transition"
            >
              <span>{d.file_name}</span>

              <Link
                to={`/chat/${d._id}`}
                className="px-4 py-1 bg-purple-600 rounded-lg text-sm"
              >
                Open →
              </Link>
            </div>
          ))}

          {datasets.length === 0 && (
            <p className="text-gray-500 text-center">No datasets yet</p>
          )}
        </div>
      </div>

    </div>
  );
}