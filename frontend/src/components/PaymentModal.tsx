"use client";

import { X, CheckCircle2, Copy, Smartphone, Clock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { User } from "@/lib/store";

// ── Config ────────────────────────────────────────────────────────────────────
const UPI_ID   = "satyaprakashvermas200-4@okaxis";
const PAYEE_NAME = "FitAI";

interface Plan {
  id: string;
  name: string;
  price: string;
  credits: string;
  period?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  user: User | null;
  onPaymentDone: () => void;
}

function buildUpiUrl(amount: number, planName: string) {
  const note = encodeURIComponent(`FitAI ${planName} Plan Subscription`);
  return `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${amount}&cu=INR&tn=${note}`;
}

function buildQrUrl(upiUrl: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=000000&qzone=2&format=png`;
}

function generateInvoiceId() {
  const now = new Date();
  return `FITAI-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export default function PaymentModal({ isOpen, onClose, plan, user, onPaymentDone }: PaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [invoiceId] = useState(generateInvoiceId);
  const [invoiceDate] = useState(() => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }));

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setConfirmed(false);
    }
  }, [isOpen]);

  if (!plan) return null;

  const amount = plan.id === "pro" ? 499 : 1499;
  const gst    = Math.round(amount * 0.18);
  const total  = amount + gst;
  const upiUrl = buildUpiUrl(total, plan.name);
  const qrUrl  = buildQrUrl(upiUrl);

  const copyUpi = async () => {
    await navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onPaymentDone();
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="bg-white w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl relative"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {/* ── Close button ─────────────────────────────────────────── */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── Invoice Header ────────────────────────────────────────── */}
            <div className="bg-black text-white px-8 py-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-white/50 mb-1">Payment Invoice</p>
                  <h2 className="text-3xl font-serif tracking-tight">FitAI</h2>
                  <p className="text-white/50 text-xs mt-1">Virtual Try-On Platform</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1">Invoice No.</p>
                  <p className="text-sm font-mono text-white">{invoiceId}</p>
                  <p className="text-[11px] text-white/40 mt-1">{invoiceDate}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">

              {/* ── LEFT: Invoice Details ─────────────────────────────── */}
              <div className="p-8 flex flex-col gap-6">

                {/* Billed To */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Billed To</p>
                  <p className="text-sm font-semibold text-black">{user?.full_name || "Customer"}</p>
                  <p className="text-xs text-gray-500">{user?.email || ""}</p>
                </div>

                {/* Item Table */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Order Summary</p>
                  <div className="border border-gray-100">
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
                      <div>
                        <p className="text-sm text-black font-medium">FitAI {plan.name} Plan</p>
                        <p className="text-[11px] text-gray-400">{plan.credits} · 1 month</p>
                      </div>
                      <span className="text-sm text-black font-semibold">₹{amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-50">
                      <span className="text-xs text-gray-500">GST (18%)</span>
                      <span className="text-xs text-gray-500">₹{gst.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 bg-black text-white">
                      <span className="text-xs font-bold uppercase tracking-widest">Total Payable</span>
                      <span className="text-base font-bold font-mono">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="border border-gray-100 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Included in {plan.name}</p>
                  <ul className="space-y-1.5">
                    {plan.id === "pro" ? (
                      <>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />500 Credits per month (~250 tries)</li>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />HD image quality output</li>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />Priority processing queue</li>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />Unlimited lookbook saves</li>
                      </>
                    ) : (
                      <>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />Unlimited try-on generations</li>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />Ultra HD 4K output</li>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />Top priority queue</li>
                        <li className="text-xs text-gray-600 flex items-center gap-2"><span className="w-1 h-1 bg-black rounded-full shrink-0" />24/7 Dedicated support</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Secure UPI</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Instant Activation</span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: QR Code ────────────────────────────────────── */}
              <div className="p-8 flex flex-col items-center justify-between gap-6">

                <div className="w-full text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-400 mb-1">Scan &amp; Pay</p>
                  <p className="text-lg font-serif text-black">₹{total.toLocaleString("en-IN")}</p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-[220px] h-[220px] border-2 border-black p-3 bg-white flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt="UPI QR Code"
                        width={196}
                        height={196}
                        className="block"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=196x196&data=${encodeURIComponent(upiUrl)}`;
                        }}
                      />
                    </div>
                    {/* Corner accents */}
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black -translate-x-1 -translate-y-1" />
                    <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black translate-x-1 -translate-y-1" />
                    <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black -translate-x-1 translate-y-1" />
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black translate-x-1 translate-y-1" />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* UPI App icons */}
                    <div className="flex -space-x-1">
                      {["https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png"].map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={src} alt="UPI" className="w-8 h-5 object-contain" />
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Any UPI App</span>
                  </div>
                </div>

                {/* UPI ID copy */}
                <div className="w-full">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 text-center">Or pay manually</p>
                  <button
                    onClick={copyUpi}
                    className="w-full flex items-center justify-between px-4 py-3 border border-black/10 hover:border-black transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-mono text-black">{UPI_ID}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                      <Copy className="w-3 h-3" />
                      {copied ? "Copied!" : "Copy"}
                    </div>
                  </button>
                </div>

                {/* Divider */}
                <div className="w-full border-t border-gray-100" />

                {/* After payment instructions */}
                <div className="w-full space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">After paying, click below</p>
                  {!confirmed ? (
                    <button
                      onClick={handleConfirm}
                      className="w-full py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      I have completed the payment
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-full py-4 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed! Activating your plan…
                    </motion.div>
                  )}
                  <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                    Your account will be upgraded within a few minutes after verification.
                    For support, contact us via email.
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
