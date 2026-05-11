"use client";

import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PaymentModal from "@/components/PaymentModal";

const plans = [
  {
    id: "free",
    name: "Starter",
    price: "Free",
    credits: "50 Credits",
    period: undefined,
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
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubscribe = (plan: typeof plans[0]) => {
    if (!isAuthenticated) {
      router.push("/login?signup=true");
      return;
    }
    if (plan.id === "free") return;

    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handlePaymentDone = () => {
    setSuccessMsg(
      `Your ${selectedPlan?.name} plan will be activated within a few minutes after payment verification. Thank you!`
    );
    setTimeout(() => setSuccessMsg(null), 8000);
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF9F6] pt-32 pb-24 px-6 flex flex-col items-center relative font-sans">

      {/* ── Payment Modal ── */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={selectedPlan}
        user={user}
        onPaymentDone={handlePaymentDone}
      />

      {/* ── Success Banner ── */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-24 z-50 max-w-lg px-6 py-4 bg-white border border-green-200 text-green-700 text-xs shadow-xl flex items-start gap-3"
        >
          <Check className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{successMsg}</p>
        </motion.div>
      )}

      {/* ── Page Header ── */}
      <div className="text-center mb-20 max-w-2xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Investment &amp; Access</p>
        <h1 className="text-5xl md:text-6xl font-serif text-black mb-8 leading-tight">
          Elevate Your<br />Digital Wardrobe
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          Experience boundless creativity. Each generation consumes{" "}
          <strong className="text-black">2 credits</strong>.{" "}
          Choose a plan that fits your rhythm.
        </p>

        {user && (
          <div className="inline-flex items-center gap-4 px-8 py-4 bg-white border border-black/5 shadow-sm">
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Current Plan</span>
              <span className="text-sm text-black font-serif capitalize">{user.subscription}</span>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Balance</span>
              <span className="text-sm text-black font-serif">{user.credits} Credits</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Plan Cards ── */}
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
              id={`subscribe-${plan.id}`}
              onClick={() => handleSubscribe(plan)}
              disabled={user?.subscription === plan.id || plan.id === "free"}
              className={`w-full py-4 font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                user?.subscription === plan.id
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : plan.id === "free"
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-900 shadow-xl"
              }`}
            >
              {user?.subscription === plan.id ? (
                "Active Plan"
              ) : plan.id === "free" ? (
                "Sign Up Free"
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  {plan.buttonText}
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* ── UPI note ── */}
      <p className="mt-16 text-[11px] text-gray-400 uppercase tracking-widest font-bold">
        Payments via UPI · Instant activation after verification
      </p>
    </div>
  );
}
