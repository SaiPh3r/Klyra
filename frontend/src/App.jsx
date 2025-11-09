import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import HomePage from "./pages/HomePage";
import UploadPage from "./pages/UploadPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SignedOut>
              <HomePage />
            </SignedOut>

            <SignedIn>
              <Navigate to="/upload" />
            </SignedIn>
          </>
        }
      />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/chat/:datasetId" element={<ChatPage />} />

    </Routes>
  );
}