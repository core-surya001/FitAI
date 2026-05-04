"use client";

import { Check, Zap, AlertCircle, CreditCard, Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

const plans = [
  {
    id: "free",
    name: "Starter",
    price: "Free",
    credits: "50 Credits",
    desc: "Perfect for testing out the magic.",
    features: [
      "50 Free credits on signup",
      "Standard processing speed",
      "Standard resolution output",
      "Save up to 10 looks"
    ],
    buttonText: "Sign Up Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/month",
    credits: "500 Credits",
    desc: "For fashion enthusiasts.",
    features: [
      "500 Credits per month (~250 tries)",
      "Fastest processing speed",
      "High resolution (HD) output",
      "Unlimited lookbook saves",
      "Priority email support"
    ],
    buttonText: "Subscribe Now",
    popular: true,
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: "₹1499",
    period: "/month",
    credits: "Unlimited",
    desc: "For heavy users & businesses.",
    features: [
      "Unlimited try-on generations",
      "Ultra HD 4K outputs",
      "Top priority queue",
      "Commercial usage rights",
      "24/7 Dedicated support"
    ],
    buttonText: "Go Unlimited",
    popular: false,
  }
];

export default function PricingPage() {
  const { user, isAuthenticated, fetchUser } = useAuthStore();
  const router = useRouter();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenGateway = (planId: string) => {
    if (!isAuthenticated) {
      router.push("/login?signup=true");
      return;
    }
    if (planId === "free") return;
    setSelectedPlan(planId);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    
    setIsProcessing(true);
    setError(null);

    // Simulate 2 seconds of payment gateway verification
    setTimeout(async () => {
      try {
        await api.post(`/credits/subscribe/${selectedPlan}`);
        await fetchUser();
        setPaymentSuccess(true);
        setTimeout(() => {
          setSelectedPlan(null);
          setPaymentSuccess(false);
          setIsProcessing(false);
          router.push("/studio");
        }, 2000);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Payment Failed.");
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col items-center relative">
      
      {/* ── Payment Gateway Modal ── */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-dark-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-2 text-white">
                  <Lock className="w-4 h-4 text-brand-400" />
                  <span className="font-semibold">Secure Checkout</span>
                </div>
                {!isProcessing && !paymentSuccess && (
                  <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="p-6">
                {paymentSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                    <p className="text-gray-400">Your account has been upgraded and credits added.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>{error}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-6 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                      <div>
                        <p className="text-gray-400 text-sm">Selected Plan</p>
                        <p className="text-white font-bold capitalize">{selectedPlan} Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-brand-400">
                          {plans.find(p => p.id === selectedPlan)?.price}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase mb-1 block">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input type="text" required placeholder="0000 0000 0000 0000" className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase mb-1 block">Expiry Date</label>
                        <input type="text" required placeholder="MM/YY" className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-brand-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-semibold uppercase mb-1 block">CVV</label>
                        <input type="password" required placeholder="123" className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-brand-500" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-semibold uppercase mb-1 block">Cardholder Name</label>
                      <input type="text" required placeholder="John Doe" className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-brand-500" />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isProcessing}
                      className="w-full py-3.5 mt-6 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:-translate-y-0.5 disabled:opacity-50 flex justify-center"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        `Pay ${plans.find(p => p.id === selectedPlan)?.price}`
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-4 flex justify-center items-center gap-1">
                      <Lock className="w-3 h-3" /> Secure 256-bit SSL encryption
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ── End Modal ── */}

      <div className="text-center mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold font-outfit text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-400 text-lg mb-4">
          Each virtual try-on costs <strong className="text-white">2 credits</strong>. 
          Start for free, upgrade when you need more magic.
        </p>
        
        {user && (
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <span className="text-gray-400">Current Plan:</span>
            <span className="text-white font-bold capitalize">{user.subscription}</span>
            <span className="mx-2 text-white/20">|</span>
            <span className="text-gray-400">Balance:</span>
            <span className="text-brand-400 font-bold">{user.credits} Credits</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {plans.map((plan, i) => (
          <motion.div 
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card rounded-2xl p-8 relative flex flex-col ${
              plan.popular ? "border-brand-500 shadow-[0_0_30px_rgba(139,92,246,0.15)] transform md:-translate-y-4" : "border-white/10"
            } ${user?.subscription === plan.id ? "ring-2 ring-brand-500 ring-offset-4 ring-offset-dark-bg" : ""}`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </div>
            )}
            
            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-sm text-gray-400 mb-6">{plan.desc}</p>
            
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">{plan.price}</span>
              {plan.period && <span className="text-gray-400">{plan.period}</span>}
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg border border-white/10 mb-8 w-max">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="text-brand-300 font-medium text-sm">{plan.credits}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleOpenGateway(plan.id)}
              disabled={user?.subscription === plan.id || plan.id === "free"}
              className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center ${
                user?.subscription === plan.id
                  ? "bg-white/5 text-gray-500 cursor-not-allowed border border-white/5"
                  : plan.id === "free"
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : plan.popular 
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:-translate-y-0.5" 
                      : "bg-white/10 hover:bg-white/20 text-white hover:-translate-y-0.5"
              }`}
            >
              {user?.subscription === plan.id ? "Current Plan" : plan.buttonText}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
