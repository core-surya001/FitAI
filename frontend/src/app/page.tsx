"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, User, UploadCloud, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center justify-center overflow-x-hidden bg-[#FAF9F6] text-black">
      
      {/* Hero Section */}
      <section className="relative w-full min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full z-0">
          <img 
            src="/hero-model.png" 
            alt="Virtual Try On Model" 
            className="object-cover w-full h-full object-center opacity-90"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex flex-col items-start justify-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">
              AI Virtual Couture
            </p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl md:text-8xl font-serif tracking-tight text-black leading-[1.1] mb-8"
            >
              The Future of<br/>Fitting
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-lg md:text-xl text-gray-600 max-w-lg mb-10 leading-relaxed font-sans"
            >
              Experience frictionless fashion. Our advanced AI seamlessly drapes high-end garments onto your digital twin, redefining how you discover and style your wardrobe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center gap-4"
            >
              <Link
                href="/studio"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-medium hover:bg-gray-900 transition-all text-sm w-full sm:w-auto"
              >
                Start Your Studio <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/discovery"
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-black text-black font-medium hover:bg-black/5 transition-all text-sm w-full sm:w-auto"
              >
                Explore Collections
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full bg-white py-32 border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">The Methodology</p>
            <h2 className="text-5xl md:text-6xl font-serif text-black mb-8">The Process</h2>
            <p className="text-gray-500 font-sans max-w-xl mx-auto leading-relaxed">Three seamless movements to redefine your aesthetic through intelligent virtual synthesis.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <FeatureCard 
              number="01"
              title="Upload"
              desc="Initialize your digital silhouette. Our engines map your unique proportions with surgical precision."
            />
            <FeatureCard 
              number="02"
              title="Synthesis"
              desc="Orchestrate your ensemble. Watch as premium textiles dynamically adapt to your form in real-time."
            />
            <FeatureCard 
              number="03"
              title="Refinement"
              desc="Perfect the presentation. Curate lighting, textures, and layers in your personal high-fidelity studio."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-black/5 bg-[#FAF9F6] pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <span className="text-3xl font-serif tracking-tight text-black">
                FitAI
              </span>
            </Link>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold max-w-xs font-sans leading-relaxed">
              Engineered for Elegance.<br/>Digital Couture for the Modern Era.
            </p>
          </div>
          
          <div className="flex gap-16 font-sans">
            <div className="flex flex-col gap-4">
              <Link href="#" className="text-[10px] text-black font-bold uppercase tracking-widest hover:opacity-50 transition-opacity">Legal & Privacy</Link>
              <Link href="#" className="text-[10px] text-black font-bold uppercase tracking-widest hover:opacity-50 transition-opacity">Terms of Vision</Link>
            </div>
            <div className="flex flex-col gap-4">
              <Link href="#" className="text-[10px] text-black font-bold uppercase tracking-widest hover:opacity-50 transition-opacity">Institutional</Link>
              <Link href="#" className="text-[10px] text-black font-bold uppercase tracking-widest hover:opacity-50 transition-opacity">Contact Studio</Link>
            </div>
          </div>

          <div className="text-right text-gray-400 text-[10px] uppercase tracking-widest font-bold font-sans">
            <p>© 2024 FitAI Virtual Couture.</p>
            <p className="mt-2 text-black/20 italic">Established in the Future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex flex-col items-start text-left group">
      <div className="text-5xl font-serif text-black/5 mb-8 group-hover:text-black transition-colors duration-700">
        {number}
      </div>
      <h3 className="text-xl font-serif text-black mb-4 tracking-tight">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed font-sans max-w-xs">{desc}</p>
    </div>
  );
}
