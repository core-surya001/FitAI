"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Zap, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Zustand Global State
  const { user, isAuthenticated, isLoading, fetchUser, logout } = useAuthStore();

  useEffect(() => {
    fetchUser(); // Fetch user session on mount
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchUser]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-dark-bg/80 backdrop-blur-md border-b border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-800 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Fit<span className="text-brand-500">AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-white ${
              pathname === "/" ? "text-white" : "text-gray-400"
            }`}
          >
            Home
          </Link>
          <Link
            href="/studio"
            className={`text-sm font-medium transition-colors hover:text-white ${
              pathname === "/studio" ? "text-white" : "text-gray-400"
            }`}
          >
            Try-On Studio
          </Link>
          <Link
            href="/stylist"
            className={`text-sm font-medium transition-colors hover:text-white ${
              pathname === "/stylist" ? "text-white" : "text-gray-400"
            }`}
          >
            AI Stylist
          </Link>
          <Link
            href="/pricing"
            className={`text-sm font-medium transition-colors hover:text-white ${
              pathname === "/pricing" ? "text-white" : "text-gray-400"
            }`}
          >
            Pricing
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="flex gap-4 items-center">
              <div className="w-24 h-9 animate-pulse bg-white/5 rounded-full"></div>
              <div className="w-10 h-10 animate-pulse bg-white/5 rounded-full"></div>
            </div>
          ) : isAuthenticated && user ? (
            <>
              {/* Credit Indicator */}
              <Link href="/pricing">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 hover:bg-brand-500/20 transition-colors cursor-pointer">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-bold">{user.credits} Credits</span>
                </div>
              </Link>
              
              {/* User Profile Dropdown Toggle */}
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-300" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-white/10 rounded-xl shadow-xl py-2 overflow-hidden flex flex-col">
                    <div className="px-4 py-2 border-b border-white/5 mb-2">
                      <p className="text-sm text-white font-medium truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login?signup=true"
                className="text-sm font-medium px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 transition-all transform hover:-translate-y-0.5"
              >
                Get 50 Free Credits
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
