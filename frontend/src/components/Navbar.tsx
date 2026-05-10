"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingBag, User, LogOut } from "lucide-react";
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
    fetchUser();
    
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

  if (pathname.startsWith("/login")) return null;

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FAF9F6]/90 backdrop-blur-md border-b border-black/5 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-serif tracking-tight text-black">
            FitAI
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/discovery"
            className={`text-sm font-medium transition-colors hover:text-black ${
              pathname === "/discovery" ? "text-black border-b border-black pb-1" : "text-gray-500"
            }`}
          >
            Discovery
          </Link>
          <Link
            href="/studio"
            className={`text-sm font-medium transition-colors hover:text-black ${
              pathname === "/studio" ? "text-black border-b border-black pb-1" : "text-gray-500"
            }`}
          >
            Studio
          </Link>
          <Link
            href="/stylist"
            className={`text-sm font-medium transition-colors hover:text-black ${
              pathname === "/stylist" ? "text-black border-b border-black pb-1" : "text-gray-500"
            }`}
          >
            Assistant
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6 text-black">
          <button className="hover:text-gray-600 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="hover:text-gray-600 transition-colors">
            <ShoppingBag className="w-5 h-5" />
          </button>

          {isLoading ? (
            <div className="w-5 h-5 animate-pulse bg-gray-200 rounded-full"></div>
          ) : isAuthenticated && user ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hover:text-gray-600 transition-colors flex items-center"
              >
                <User className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-2 overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-gray-50 mb-2">
                    <p className="text-sm font-medium text-black truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link href="/pricing" className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                    Credits: {user.credits}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hover:text-gray-600 transition-colors flex items-center"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
