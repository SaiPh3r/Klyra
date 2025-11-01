import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const { user, isSignedIn } = useUser();

  // signup API call here
  useEffect(() => {
    if (isSignedIn && user) {
      fetch("https://klyra-e6ui.onrender.com/signup", {
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

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Welcome to Klyra</h1>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign In / Sign Up
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Klyra Dashboard</h1>
        <UserButton />
      </header>

      <p>Welcome back, {user.firstName} 👋</p>

      <Link
        to="/upload"
        className="mt-6 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Upload Dataset
      </Link>
    </div>
  );
}