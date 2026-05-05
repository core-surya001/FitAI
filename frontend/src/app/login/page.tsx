"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // If URL has ?signup=true, default to Signup view
    if (searchParams.get("signup") === "true") {
      setIsLogin(false); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login API Call
        const response = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", response.data.access_token);
        
      } else {
        // Signup API Call
        try {
          await api.post("/auth/signup", { full_name: fullName, email, password });
        } catch (signupErr: any) {
          // If the email already exists (409)
          if (signupErr.response?.status === 409) {
            setError("Email already registered. Please sign in.");
            setIsLogin(true); // Automatically switch to Login mode
            setIsLoading(false);
            return; // Stop execution here
          } else {
            throw signupErr;
          }
        }
        
        // After successful signup, automatically login
        const loginResponse = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", loginResponse.data.access_token);
      }

      // Refresh global user state
      await fetchUser();
      
      // Redirect to Studio
      router.push("/studio");
      
    } catch (err: any) {
      console.error(err);
      
      // Extract detailed error message
      let errorMessage = "An error occurred. Please try again.";
      if (err.code === "ERR_NETWORK") {
        errorMessage = "Network error: Unable to connect to the server. Please check your connection.";
      } else if (err.response?.status === 401) {
        errorMessage = "Incorrect email or password.";
      } else if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === "string" 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 rounded-2xl border-white/10 relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/20 rounded-full blur-[40px] pointer-events-none" />

        <div className="text-center mb-8 relative z-10">
          <h2 className="text-3xl font-bold text-white font-outfit mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-400 text-sm">
            {isLogin 
              ? "Sign in to access your digital closet." 
              : "Sign up today and get 50 free credits instantly."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-4 relative z-10" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                type="text" 
                required={!isLogin}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-gray-600"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-gray-600"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all mt-6 ${
              isLoading 
                ? "bg-brand-600/50 text-white/50 cursor-not-allowed" 
                : "bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:-translate-y-0.5"
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Sign Up & Get Credits"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400 relative z-10">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-brand-400 font-semibold hover:text-brand-300 transition-colors"
          >
            {isLogin ? "Create one" : "Sign In"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[calc(100vh-80px)] flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
