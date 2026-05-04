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
      // Send the chat history to the backend
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
    <div className="w-full h-[calc(100vh-80px)] max-w-4xl mx-auto p-4 md:p-6 flex flex-col">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white font-outfit flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-400" />
          AI Personal Stylist
        </h1>
        <p className="text-gray-400 text-sm mt-2">Get personalized outfit recommendations based on your unique profile.</p>
      </div>

      <div className="flex-1 glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
        
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user" 
                  ? "bg-brand-600 text-white" 
                  : "bg-white/10 text-brand-400 border border-brand-500/30"
              }`}>
                {msg.role === "user" ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${
                msg.role === "user" 
                  ? "bg-brand-600 text-white rounded-tr-none" 
                  : "bg-white/5 text-gray-200 border border-white/10 rounded-tl-none leading-relaxed"
              }`}>
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={line === "" ? "h-2" : "mb-1 last:mb-0"}>{line}</p>
                ))}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 border-t border-white/5">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your body type, occasion, or preferences..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-5 pr-14 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
