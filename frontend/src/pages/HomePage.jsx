import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

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
  <div className="min-h-screen bg-[#070708] text-white">


    <nav className="fixed top-0 left-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-4">

     
        <div className="w-1/3">
          <h1 className="text-xl font-bold tracking-wide">Klyra</h1>
        </div>

      
        <div className="hidden md:flex justify-center w-1/3 gap-8 text-sm">
          <a href="#features" className="text-gray-300">Features</a>
          <a href="#pricing" className="text-gray-300">Pricing</a>
          <a href="#about" className="text-gray-300">About</a>
        </div>

       
        <div className="w-1/3 flex justify-end">
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-purple-600 rounded-lg text-white font-medium">
              Get Started
            </button>
          </SignInButton>
        </div>
      </div>
    </nav>

    <section className="pt-40 md:pt-48 pb-32 text-center px-6">
      <h2 className="text-4xl md:text-6xl font-extrabold leading-tight">
        Transform Your <span className="text-purple-400">Data</span> Into
        Actionable <span className="text-purple-400">Insights</span>
      </h2>
      <p className="mt-6 text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
        Upload datasets. Analyse instantly. Zero setup.  
        Klyra replaces dashboards like Power BI & Tableau — at 10x speed.
      </p>

      <SignInButton mode="modal">
        <button className="mt-10 px-8 py-3 text-lg bg-purple-600 rounded-xl font-semibold">
          Get Started →
        </button>
      </SignInButton>
    </section>


    <section id="features" className="pt-20 pb-32 px-6 md:px-10">
      <h2 className="text-3xl font-bold text-center">Powerful Features</h2>
      <p className="text-center text-gray-400 mt-2">
        Everything you need for instant data intelligence
      </p>

      <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
        <div className="p-10 min-h-[260px] bg-black/30 border border-white/10 rounded-2xl">
          <h3 className="text-xl font-semibold mb-3">Upload CSV</h3>
          <p className="text-gray-400">Just drag & drop — no setup needed.</p>
        </div>

        <div className="p-10 min-h-[260px] bg-black/30 border border-white/10 rounded-2xl">
          <h3 className="text-xl font-semibold mb-3">Instant Analytics</h3>
          <p className="text-gray-400">Detect patterns, outliers & stats.</p>
        </div>

        <div className="p-10 min-h-[260px] bg-black/30 border border-white/10 rounded-2xl">
          <h3 className="text-xl font-semibold mb-3">AI Explanations</h3>
          <p className="text-gray-400">Klyra explains your data in English.</p>
        </div>
      </div>
    </section>


    <section id="pricing" className="pt-32 pb-32 px-6 md:px-10">
      <h2 className="text-3xl font-bold text-center">Pricing Plans</h2>
      <p className="text-center text-gray-400 mt-2">USD / month</p>

      <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
        
        <div className="p-10 min-h-[420px] bg-black/30 border border-white/10 rounded-2xl flex flex-col justify-between transition-transform duration-300 hover:-translate-y-2">
          <div>
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="text-4xl font-bold mt-3">$0</p>
            <p className="text-gray-400 mt-4">Test the power of Klyra</p>
          </div>
          <button className="mt-8 px-5 py-2 bg-gray-800 rounded-xl text-gray-200">
            Start Free
          </button>
        </div>

        <div className="p-10 min-h-[420px] bg-black/30 border border-purple-500 rounded-2xl flex flex-col justify-between shadow-[0_0_25px_rgba(128,0,255,0.3)] transition-transform duration-300 hover:-translate-y-2">
          <div>
            <div className="px-3 py-1 rounded-full bg-purple-600 text-xs font-semibold w-fit mb-3">
              POPULAR
            </div>
            <h3 className="text-xl font-semibold text-purple-300">Pro</h3>
            <p className="text-4xl font-bold mt-3">$15</p>
            <p className="text-gray-400 mt-4">For serious analysts</p>
          </div>
          <button className="mt-8 px-5 py-3 bg-purple-600 rounded-xl font-semibold">
            Subscribe
          </button>
        </div>

        <div className="p-10 min-h-[420px] bg-black/30 border border-white/10 rounded-2xl flex flex-col justify-between transition-transform duration-300 hover:-translate-y-2">
          <div>
            <h3 className="text-xl font-semibold">Pay as you go</h3>
            <p className="text-4xl font-bold mt-3">~$0.50</p>
            <p className="text-gray-400 mt-4">Scale as usage grows</p>
          </div>
          <button className="mt-8 px-5 py-2 bg-purple-600 rounded-xl">
            Start Creating
          </button>
        </div>

      </div>
    </section>


    <section id="about" className="pt-28 pb-32 px-6 md:px-10 max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-6">About Klyra</h2>
      <p className="text-gray-400 text-lg leading-[1.6]">
        Klyra removes friction from analytics.
        No dashboards. No BI complexity. Just upload & understand.
      </p>
    </section>


    <footer className="border-t border-white/10 py-6 text-center text-gray-400 text-sm">
      Made by Sai — <a className="text-purple-400 underline" href="https://github.com/SaiPh3r/Klyra" target="_blank">GitHub Repo</a>
    </footer>

  </div>
); }
}