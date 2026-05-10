"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight, Heart } from "lucide-react";
import Link from "next/link";

const CATEGORIES = ["All", "Minimal", "Avant-Garde", "Casual", "Evening", "Streetwear"];

const LOOKS = [
  {
    id: 1,
    title: "Celestial Silk",
    category: "Evening",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Nordic Minimal",
    category: "Minimal",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Urban Edge",
    category: "Streetwear",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "Desert Bloom",
    category: "Casual",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Onyx Avant",
    category: "Avant-Garde",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: 6,
    title: "Sahara Breeze",
    category: "Casual",
    image: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=600&auto=format&fit=crop",
  },
];

export default function DiscoveryPage() {
  const [activeCategory, setActiveCategory] = React.useState("All");

  const filteredLooks = activeCategory === "All" 
    ? LOOKS 
    : LOOKS.filter(look => look.category === activeCategory);

  return (
    <div className="w-full min-h-screen bg-[#FAF9F6] pt-32 pb-24 px-6 flex flex-col font-sans">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full mb-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Curated Inspiration</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-5xl md:text-6xl font-serif text-black mb-6">Discovery</h1>
            <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
              Explore a world of AI-generated ensembles. Every look is a synthesis of cutting-edge tech and high-end couture.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/studio" className="bg-black text-white px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Start Generating
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto w-full mb-12 flex gap-4 overflow-x-auto pb-4 no-scrollbar border-b border-black/5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] uppercase tracking-widest font-bold whitespace-nowrap px-6 py-3 transition-all ${
              activeCategory === cat 
                ? "bg-black text-white" 
                : "text-gray-400 hover:text-black"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {filteredLooks.map((look, i) => (
          <motion.div
            key={look.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 mb-6 shadow-sm group-hover:shadow-xl transition-all duration-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={look.image} 
                alt={look.title} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-10 h-10 bg-white/90 backdrop-blur-md flex items-center justify-center text-black hover:bg-black hover:text-white transition-all">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700" />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">{look.category}</p>
                <h3 className="text-xl font-serif text-black">{look.title}</h3>
              </div>
              <button className="w-10 h-10 border border-black/5 flex items-center justify-center text-black hover:bg-black hover:text-white transition-all">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      <div className="max-w-7xl mx-auto w-full mt-24 flex justify-center">
        <button className="px-12 py-5 border border-black text-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm">
          Load More Inspirations
        </button>
      </div>

    </div>
  );
}
