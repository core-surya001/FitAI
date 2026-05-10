"use client";

import { Check, Zap, AlertCircle, X } from "lucide-react";
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
          color: "#000000"
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
    <div className="w-full min-h-screen bg-[#FAF9F6] pt-32 pb-24 px-6 flex flex-col items-center relative font-sans">
      
      {/* ── Status Messages ── */}
      <AnimatePresence>
        {paymentSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border border-black/5 rounded-none p-12 flex flex-col items-center text-center shadow-2xl max-w-sm"
            >
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif text-black mb-2">Payment Successful</h3>
              <p className="text-gray-500 text-sm">Your account has been upgraded. Redirecting to your studio...</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {error && (
        <div className="fixed top-24 z-50 p-4 bg-white border border-red-100 flex items-center gap-3 text-red-600 text-xs uppercase tracking-widest font-bold shadow-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-4 text-gray-400 hover:text-black">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="text-center mb-20 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Investment & Access</p>
        <h1 className="text-5xl md:text-6xl font-serif text-black mb-8 leading-tight">Elevate Your<br/>Digital Wardrobe</h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          Experience boundless creativity. Each generation consumes <strong className="text-black">2 credits</strong>. 
          Choose a plan that fits your rhythm.
        </p>
        
        {user && (
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-white border border-black/5 shadow-sm">
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Current Plan</span>
              <span className="text-sm text-black font-serif capitalize">{user.subscription}</span>
            </div>
            <div className="w-px h-8 bg-gray-100"></div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Balance</span>
              <span className="text-sm text-black font-serif">{user.credits} Credits</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {plans.map((plan, i) => (
          <motion.div 
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-10 flex flex-col border border-black/5 shadow-sm hover:shadow-md transition-all relative ${
              plan.popular ? "md:-translate-y-4 ring-1 ring-black" : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest">
                Recommended
              </div>
            )}
            
            <h3 className="text-xl font-serif text-black mb-2">{plan.name}</h3>
            <p className="text-xs text-gray-400 mb-8 uppercase tracking-widest font-bold">{plan.credits}</p>
            
            <div className="mb-8">
              <span className="text-4xl font-serif text-black">{plan.price}</span>
              {plan.period && <span className="text-gray-500 text-sm">{plan.period}</span>}
            </div>

            <p className="text-sm text-gray-500 mb-8 leading-relaxed italic">&ldquo;{plan.desc}&rdquo;</p>

            <ul className="space-y-4 mb-10 flex-1 border-t border-gray-50 pt-8">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span className="text-gray-600 text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleOpenGateway(plan.id)}
              disabled={user?.subscription === plan.id || plan.id === "free" || isProcessing}
              className={`w-full py-4 font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center ${
                user?.subscription === plan.id
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : plan.id === "free"
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-900 shadow-xl"
              }`}
            >
              {isProcessing && plan.id !== "free" ? (
                 <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                user?.subscription === plan.id ? "Active Plan" : plan.buttonText
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
