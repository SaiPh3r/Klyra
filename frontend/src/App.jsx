import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

export default function App() {
  const { user, isSignedIn } = useUser();

  // 🔹 Handle new/existing users
  useEffect(() => {
    if (isSignedIn && user) {
      fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: user.fullName,
          email: user.primaryEmailAddress.emailAddress,
        }),
      });
    }
  }, [isSignedIn, user]);

  //  If not signed in → show sign in button
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Welcome to Klyra </h1>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign In / Sign Up
          </button>
        </SignInButton>
      </div>
    );
  }

  //  If signed in → show dashboard
  return (
    <div className="dashboard p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Klyra Dashboard</h1>
        <UserButton redirectUrl="/" />
      </header>

      <p className="text-lg">Welcome back, {user.firstName} </p>
      <p className="text-gray-600 mt-2">Your email: {user.primaryEmailAddress.emailAddress}</p>
    </div>
  );
}