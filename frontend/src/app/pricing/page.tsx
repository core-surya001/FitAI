"use client";

import { Check, Zap, AlertCircle, CreditCard, Lock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  const handleOpenGateway = async (planId: string) => {
    if (!isAuthenticated) {
      router.push("/login?signup=true");
      return;
    }
    if (planId === "free") return;
    
    setIsProcessing(true);
    setError(null);

    const res = await loadRazorpayScript();
    if (!res) {
      setError("Failed to load Razorpay SDK. Please check your connection.");
      setIsProcessing(false);
      return;
    }

    try {
      // Create order
      const orderResponse = await api.post(`/credits/create-order/${planId}`);
      const orderData = orderResponse.data;

      const options = {
        key: orderData.key_id, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "FitAI Subscription",
        description: `Subscribe to ${planId} plan`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            await api.post("/credits/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_name: planId
            });
            await fetchUser();
            setPaymentSuccess(true);
            setTimeout(() => {
              setPaymentSuccess(false);
              router.push("/studio");
            }, 3000);
          } catch (err) {
            setError("Payment verification failed.");
          }
        },
        prefill: {
          name: user?.full_name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#8B5CF6"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        setError(response.error.description || "Payment failed");
      });
      paymentObject.open();

    } catch (err: unknown) {
      const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to initiate payment.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col items-center relative">
      
      {/* ── Status Messages ── */}
      <AnimatePresence>
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="bg-dark-card border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4 border border-green-500/30">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-gray-400">Your account has been upgraded. Redirecting...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {error && (
        <div className="fixed top-24 z-50 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-sm max-w-md mx-auto shadow-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* ── End Status Messages ── */}

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
