// pages/UploadPage.jsx
import { useUser } from "@clerk/clerk-react";
import UploadDataset from "../components/UploadDataset";

export default function UploadPage() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Upload Dataset</h1>
      <UploadDataset userId={user.id} />
    </div>
  );
}