"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Sparkles, Image as ImageIcon, Shirt, RefreshCw, Download, Zap, Loader2, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Asset {
  id: string | number;
  name: string;
  url: string;
  type: "default" | "custom";
}

interface TryonHistory {
  id: string | number;
  result_url: string;
}

// Dummy Data from Unsplash
const DEFAULT_MODELS: Asset[] = [
  { id: "m1", name: "Female Model", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop", type: "default" },
  { id: "m2", name: "Male Model", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop", type: "default" },
];

const DEFAULT_GARMENTS: Asset[] = [
  { id: "g1", name: "White T-Shirt", url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop", type: "default" },
  { id: "g2", name: "Leather Jacket", url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=400&auto=format&fit=crop", type: "default" },
  { id: "g3", name: "Summer Dress", url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=400&auto=format&fit=crop", type: "default" },
  { id: "g4", name: "Denim Shirt", url: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=400&auto=format&fit=crop", type: "default" },
];

export default function StudioPage() {
  const router = useRouter();
  const { user, isAuthenticated, deductCredits } = useAuthStore();
  
  const [selectedModel, setSelectedModel] = useState<Asset | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Asset | null>(null);
  
  const [userModels, setUserModels] = useState<Asset[]>([]);
  const [userGarments, setUserGarments] = useState<Asset[]>([]);
  const [tryonHistory, setTryonHistory] = useState<TryonHistory[]>([]);

  const [isUploadingModel, setIsUploadingModel] = useState(false);
  const [isUploadingGarment, setIsUploadingGarment] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const modelInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  const fetchUserAssets = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [photosRes, garmentsRes, historyRes] = await Promise.all([
        api.get("/photos/"),
        api.get("/garments/"),
        api.get("/tryon/history")
      ]);
      setUserModels(photosRes.data.map((p: {id: string, file_path: string}) => ({ ...p, name: "Model", url: `http://localhost:8000/${p.file_path}`, type: "custom" })));
      setUserGarments(garmentsRes.data.map((g: {id: string, file_path: string}) => ({ ...g, name: "Garment", url: `http://localhost:8000/${g.file_path}`, type: "custom" })));
      setTryonHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserAssets(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchUserAssets]);

  const handleUploadModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !isAuthenticated) return;
    setIsUploadingModel(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      await api.post("/photos/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchUserAssets();
    } catch (err) {
      console.error(err);
      setError("Failed to upload model.");
    } finally {
      setIsUploadingModel(false);
    }
  };

  const handleUploadGarment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !isAuthenticated) return;
    setIsUploadingGarment(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    formData.append("name", "My Garment");

    try {
      await api.post("/garments/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchUserAssets();
    } catch (err) {
      console.error(err);
      setError("Failed to upload garment.");
    } finally {
      setIsUploadingGarment(false);
    }
  };

  const handleDeleteModel = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    try {
      await api.delete(`/photos/${id}`);
      if (selectedModel?.id === id) setSelectedModel(null);
      fetchUserAssets();
    } catch (err) {
      console.error("Failed to delete model", err);
    }
  };

  const handleDeleteGarment = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    try {
      await api.delete(`/garments/${id}`);
      if (selectedGarment?.id === id) setSelectedGarment(null);
      fetchUserAssets();
    } catch (err) {
      console.error("Failed to delete garment", err);
    }
  };

  const handleDeleteHistory = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    try {
      await api.delete(`/tryon/${id}`);
      fetchUserAssets();
    } catch (err) {
      console.error("Failed to delete history", err);
    }
  };

  const handleGenerate = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (user && user.credits < 2) {
      setError("Not enough credits! Please upgrade your plan.");
      return;
    }

    if (!selectedModel || !selectedGarment) return;
    
    if (selectedModel.type === 'default' || selectedGarment.type === 'default') {
      setError("Please upload your own photo and garment to generate a real try-on!");
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    deductCredits(2);

    const generateLook = async () => {
      try {
        const response = await api.post("/tryon/generate", {
          user_photo_id: selectedModel.id,
          garment_id: selectedGarment.id
        });
        
        setIsGenerating(false);
        if (response.data && response.data.result_url) {
          setResultImage(response.data.result_url);
          fetchUserAssets(); // Refresh history
        } else {
          setError("Generated image URL is missing.");
        }
      } catch (err: unknown) {
        setIsGenerating(false);
        const errorMessage = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to generate try-on. Please try again.";
        setError(errorMessage);
      }
    };
    
    generateLook();
  };

  const allModels = [...userModels, ...DEFAULT_MODELS];
  const allGarments = [...userGarments, ...DEFAULT_GARMENTS];

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden">
      
      {/* LEFT PANEL: User Models */}
      <div className="w-full md:w-80 border-r border-white/5 bg-dark-card/50 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            Your Models
          </h2>
          <input type="file" className="hidden" ref={modelInputRef} onChange={handleUploadModel} accept="image/*" />
          <button 
            onClick={() => isAuthenticated ? modelInputRef.current?.click() : router.push("/login")}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            {isUploadingModel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 gap-3 custom-scrollbar">
          {allModels.map(model => (
            <div 
              key={model.id} 
              onClick={() => setSelectedModel(model)}
              className={`aspect-[3/4] bg-black/40 rounded-xl border-2 cursor-pointer transition-all overflow-hidden relative group ${
                selectedModel?.id === model.id ? "border-brand-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] scale-95" : "border-white/5 hover:border-white/20"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={model.url} alt={model.name || "Model"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex justify-between items-end">
                <p className="text-[10px] font-medium text-white truncate w-full">{model.name || "Custom Upload"}</p>
                {model.type === "custom" && (
                  <button 
                    onClick={(e) => handleDeleteModel(e, model.id)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MIDDLE PANEL: Garments */}
      <div className="w-full md:w-80 border-r border-white/5 bg-dark-card/30 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shirt className="w-5 h-5 text-pink-400" />
            Wardrobe
          </h2>
          <input type="file" className="hidden" ref={garmentInputRef} onChange={handleUploadGarment} accept="image/*" />
          <button 
            onClick={() => isAuthenticated ? garmentInputRef.current?.click() : router.push("/login")}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
          >
            {isUploadingGarment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            Upload
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 gap-3 custom-scrollbar">
          {allGarments.map(garment => (
            <div 
              key={garment.id} 
              onClick={() => setSelectedGarment(garment)}
              className={`aspect-square bg-black/40 rounded-xl border-2 cursor-pointer transition-all overflow-hidden relative group ${
                selectedGarment?.id === garment.id ? "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-95" : "border-white/5 hover:border-white/20"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={garment.url} alt={garment.name || "Garment"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex justify-between items-end">
                <p className="text-[10px] font-medium text-white truncate w-full">{garment.name || "Custom Upload"}</p>
                {garment.type === "custom" && (
                  <button 
                    onClick={(e) => handleDeleteGarment(e, garment.id)}
                    className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: The Canvas */}
      <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        
        {!resultImage ? (
          <div className="flex flex-col items-center justify-center p-8 w-full max-w-lg text-center">
            
            <div className="flex items-center justify-center gap-6 mb-12">
              <div className={`w-32 aspect-[3/4] rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all ${selectedModel ? 'border-brand-500 shadow-lg shadow-brand-500/20' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                {selectedModel ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedModel.url} alt="Model" className="w-full h-full object-cover" />
                ) : <ImageIcon />}
              </div>
              
              <div className="text-gray-600 font-bold text-2xl">+</div>
              
              <div className={`w-32 aspect-square rounded-2xl border-2 overflow-hidden flex items-center justify-center transition-all ${selectedGarment ? 'border-pink-500 shadow-lg shadow-pink-500/20' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                {selectedGarment ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedGarment.url} alt="Garment" className="w-full h-full object-cover" />
                ) : <Shirt />}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 py-2 px-4 rounded-lg">{error}</p>}

            {isGenerating ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-brand-500 animate-spin mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Generating Magic...</h3>
                <p className="text-gray-400 text-sm">Please wait while our AI weaves the fabric onto your model.</p>
              </motion.div>
            ) : (
              <div className="w-full space-y-3">
                <button 
                  onClick={handleGenerate}
                  disabled={!selectedModel || !selectedGarment}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedModel && selectedGarment
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:-translate-y-1"
                      : "bg-white/5 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Look
                </button>
                <p className="text-xs flex items-center justify-center gap-1 text-gray-500">
                  <Zap className="w-3 h-3 text-brand-400" />
                  Cost: 2 Credits per generation
                </p>
              </div>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full h-full p-8">
            <div className="relative h-[70vh] aspect-[3/4] bg-dark-card rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.15)] mb-8 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultImage} alt="Generated Look" className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-white">AI Generated</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setResultImage(null)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10">
                <RefreshCw className="w-4 h-4" /> Try Another
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors shadow-lg shadow-brand-500/20">
                <Download className="w-4 h-4" /> Download HD
              </button>
            </div>
          </motion.div>
        )}

        {/* RECENT LOOKS STRIP */}
        {tryonHistory.length > 0 && !resultImage && !isGenerating && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-6 w-[90%] max-w-2xl bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400"/> 
              Your Recent Looks
            </h3>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
              {tryonHistory.map((job: TryonHistory) => (
                <div 
                  key={job.id} 
                  onClick={() => setResultImage(job.result_url)} 
                  className="w-20 aspect-[3/4] shrink-0 rounded-xl bg-black/40 border border-white/10 overflow-hidden cursor-pointer hover:border-brand-500 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={job.result_url} alt="History" className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => handleDeleteHistory(e, job.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
