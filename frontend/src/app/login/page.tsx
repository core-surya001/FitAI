"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

/* ─── Main component ─────────────────────────────────────────── */
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (searchParams.get("signup") === "true") setIsLogin(false);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", res.data.access_token);
      } else {
        try {
          await api.post("/auth/signup", { full_name: fullName, email, password });
        } catch (err: any) {
          if (err.response?.status === 409) {
            setError("Email already registered. Please sign in.");
            setIsLogin(true);
            setIsLoading(false);
            return;
          }
          throw err;
        }
        const loginRes = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", loginRes.data.access_token);
      }
      await fetchUser();
      router.push("/studio");
    } catch (err: any) {
      let msg = "An error occurred. Please try again.";
      if (err.code === "ERR_NETWORK") msg = "Network error: Unable to connect. Check your connection.";
      else if (err.response?.status === 401) msg = "Incorrect email or password.";
      else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail);
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFullName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans">
      
      {/* Simple Header */}
      <div className="w-full h-20 flex items-center px-8">
        <Link href="/" className="text-2xl font-serif text-black">
          FitAI
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-10 shadow-sm border border-black/5">
          <h1 className="text-3xl font-serif text-black mb-2 text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            {isLogin ? "Enter your details to access your studio." : "Join us to curate your perfect virtual wardrobe."}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-2 overflow-hidden"
                >
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required={!isLogin}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border-b border-gray-300 py-2 focus:border-black outline-none transition-colors bg-transparent text-black"
                    placeholder="Jane Doe"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-b border-gray-300 py-2 focus:border-black outline-none transition-colors bg-transparent text-black"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex justify-between">
                <span>Password</span>
                {isLogin && <a href="#" className="text-gray-400 hover:text-black normal-case font-normal">Forgot?</a>}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-gray-300 py-2 focus:border-black outline-none transition-colors bg-transparent text-black"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full bg-black text-white py-4 font-medium hover:bg-gray-900 transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={switchMode} className="text-black font-semibold hover:underline">
              {isLogin ? "Sign up here" : "Sign in here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
