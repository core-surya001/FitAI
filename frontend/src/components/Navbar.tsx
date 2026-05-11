"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User, LogOut, Zap, LayoutGrid, Shirt, Sparkles,
  CreditCard, ChevronDown, X
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [isScrolled,  setIsScrolled]  = useState(false);
  const [isMenuOpen,  setIsMenuOpen]  = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, isLoading, fetchUser, logout } = useAuthStore();

  /* ── scroll listener & initial auth fetch ──────────────────── */
  useEffect(() => {
    fetchUser();
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchUser]);

  /* ── close dropdown on outside click ───────────────────────── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  /* ── close dropdown on route change ────────────────────────── */
  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (pathname.startsWith("/login")) return null;

  const navLinks = [
    { href: "/discovery", label: "Discovery" },
    { href: "/studio",    label: "Studio"    },
    { href: "/stylist",   label: "Assistant" },
    { href: "/pricing",   label: "Pricing"   },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#FAF9F6]/95 backdrop-blur-md border-b border-black/5 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link href="/" className="text-2xl font-serif tracking-tight text-black shrink-0">
          FitAI
        </Link>

        {/* ── Nav Links ────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors hover:text-black ${
                pathname === href
                  ? "text-black border-b border-black pb-1"
                  : "text-gray-500"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* ── Right Side ───────────────────────────────────────── */}
        <div className="flex items-center gap-3">

          {isLoading ? (
            <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full" />

          ) : isAuthenticated && user ? (
            <>
              {/* ── Credits Badge ──────────────────────────────── */}
              <Link
                href="/pricing"
                title="View your credits"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                <Zap className="w-3 h-3" />
                {user.credits.toLocaleString()} Credits
              </Link>

              {/* ── Profile Dropdown ───────────────────────────── */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 text-sm font-medium text-black hover:text-gray-600 transition-colors"
                  aria-expanded={isMenuOpen}
                >
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold uppercase">
                    {user.full_name?.[0] ?? "U"}
                  </div>
                  <span className="hidden sm:inline text-sm max-w-[120px] truncate">{user.full_name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-black/5 shadow-2xl overflow-hidden z-50">

                    {/* User info header */}
                    <div className="px-5 py-4 bg-black text-white flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold truncate">{user.full_name}</p>
                        <p className="text-[11px] text-white/50 truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="text-white/40 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Credits info */}
                    <div className="px-5 py-3 bg-[#FAF9F6] border-b border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-black" />
                        <span className="text-xs font-bold text-black uppercase tracking-wider">Credits</span>
                      </div>
                      <span className="text-sm font-bold text-black font-mono">{user.credits.toLocaleString()}</span>
                    </div>

                    {/* Plan info */}
                    <div className="px-5 py-3 bg-[#FAF9F6] border-b border-black/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Plan</span>
                      </div>
                      <span className="text-xs font-bold text-black capitalize bg-black/5 px-2 py-0.5">{user.subscription}</span>
                    </div>

                    {/* Nav links */}
                    <div className="py-2">
                      <p className="px-5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigate</p>

                      <Link
                        href="/studio"
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        <Shirt className="w-4 h-4 text-gray-400" />
                        My Studio
                      </Link>

                      <Link
                        href="/discovery"
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        <LayoutGrid className="w-4 h-4 text-gray-400" />
                        Discovery
                      </Link>

                      <Link
                        href="/stylist"
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-gray-400" />
                        AI Stylist
                      </Link>

                      <Link
                        href="/pricing"
                        className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        Upgrade Plan
                      </Link>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-black/5 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>

                  </div>
                )}
              </div>
            </>

          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium hover:text-gray-600 transition-colors hidden sm:block"
              >
                Log In
              </Link>
              <Link
                href="/login?signup=true"
                className="text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 bg-black text-white hover:bg-gray-900 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
