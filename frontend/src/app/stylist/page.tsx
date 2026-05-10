"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function StylistPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am your personal AI Stylist. Tell me a bit about yourself—your body type, the occasion you're dressing for, or your favorite colors—and I'll recommend the perfect outfit for you!"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post("/stylist/chat", {
        message: userMessage.content,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.reply
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to fetch stylist response", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops! My fashion sensors are a bit tangled right now. Could you please try again?"
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] max-w-5xl mx-auto px-6 py-12 flex flex-col bg-[#FAF9F6] font-sans">
      <div className="text-center mb-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-2">Curated Assistance</p>
        <h1 className="text-4xl font-serif text-black flex items-center justify-center gap-3">
          <Sparkles className="w-6 h-6 text-gray-400" />
          AI Stylist
        </h1>
        <p className="text-gray-500 text-sm mt-4 font-sans max-w-lg mx-auto">Discuss your aesthetic goals, upcoming events, or style preferences with our intelligent concierge.</p>
      </div>

      <div className="flex-1 bg-white border border-black/5 flex flex-col shadow-sm overflow-hidden">
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-[#FAF9F6]/30">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                msg.role === "user" 
                  ? "bg-black text-white border-black" 
                  : "bg-white text-black border-black/5"
              }`}>
                {msg.role === "user" ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[70%] px-6 py-4 shadow-sm ${
                msg.role === "user" 
                  ? "bg-black text-white rounded-none" 
                  : "bg-white text-gray-700 border border-black/5 rounded-none leading-relaxed"
              }`}>
                <div className="text-sm font-sans">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={line === "" ? "h-2" : "mb-2 last:mb-0"}>{line}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-white text-black border border-black/5 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white border border-black/5 px-6 py-5 flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 bg-black/20 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-black/5">
          <form onSubmit={handleSend} className="relative flex items-center max-w-3xl mx-auto w-full">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inquire about styles, occasions, or pairings..."
              className="w-full bg-[#FAF9F6] border border-black/5 py-5 pl-8 pr-16 text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-all text-sm"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-gray-900 flex items-center justify-center"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-4 font-bold">
            Powered by FitAI Neural Stylist
          </p>
        </div>
      </div>
    </div>
  );
}
