"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, UploadCloud, Images, Zap, User } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full flex flex-col items-center justify-center overflow-x-hidden">
      
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
        >
          <Sparkles className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-medium text-gray-300">Powered by Next-Gen AI Models</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold font-outfit tracking-tight text-white max-w-4xl mb-6 leading-tight"
        >
          Try on clothes instantly with <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-600">Virtual Magic</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12"
        >
          Upload a photo of yourself. Upload a photo of any outfit. Let our AI blend them perfectly so you can see exactly how it looks on you before buying.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/studio"
            className="group relative flex items-center gap-2 px-8 py-4 bg-brand-600 rounded-xl font-bold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(124,58,237,0.4)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10">Start Your Try-On</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-gray-500 mt-4 sm:mt-0 sm:ml-4">
            New users get <strong className="text-white">50 free credits</strong> today.
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="w-full bg-black/40 border-y border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-white mb-4">How it works</h2>
            <p className="text-gray-400">Three simple steps to your new look</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<User className="w-8 h-8 text-brand-400" />}
              title="1. Upload Yourself"
              desc="Take a clear front-facing photo of yourself. Full body or half body works perfectly."
            />
            <FeatureCard 
              icon={<UploadCloud className="w-8 h-8 text-blue-400" />}
              title="2. Upload Garment"
              desc="Found a dress you like online? Save the photo and upload it to your digital closet."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-yellow-400" />}
              title="3. Generate Magic"
              desc="Click generate. Within seconds, our AI accurately maps the garment to your body shape and lighting."
            />
          </div>
        </div>
      </section>
      {/* Testimonials */}
      <section className="w-full py-24 px-6 relative">
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit text-white mb-4">What Our Users Say</h2>
            <p className="text-gray-400">Join thousands of people discovering their perfect style.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah Jenkins", role: "Fashion Blogger", text: "This AI is unbelievable! I upload a dress I found on Pinterest, and I can instantly see if the cut flatters my body type. Saved me hundreds on returns!" },
              { name: "David Chen", role: "Entrepreneur", text: "I hate trying on clothes in stores. Now I just upload a jacket I like, and FitAI shows me exactly how it looks. The generation is crazy fast and realistic." },
              { name: "Priya Sharma", role: "Stylist", text: "I use this with my clients all the time. Being able to visualize the final look before purchasing the actual garments has revolutionized my styling business." }
            ].map((review, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl border border-white/5 relative">
                <div className="flex text-yellow-400 mb-4">
                  {[...Array(5)].map((_, j) => <Sparkles key={j} className="w-4 h-4 mr-1" />)}
                </div>
                <p className="text-gray-300 italic mb-6">&quot;{review.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {review.name[0]}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{review.name}</h4>
                    <p className="text-gray-500 text-xs">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-black/60 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-800 flex items-center justify-center">
                <Sparkles className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Fit<span className="text-brand-500">AI</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm max-w-sm">
              The world&apos;s most advanced AI virtual try-on studio. See clothes on yourself instantly before buying.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/studio" className="hover:text-brand-400 transition-colors">Try-On Studio</Link></li>
              <li><Link href="/stylist" className="hover:text-brand-400 transition-colors">AI Stylist</Link></li>
              <li><Link href="/pricing" className="hover:text-brand-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-brand-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} FitAI. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed with ❤️ for Fashion</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
