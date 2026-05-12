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
      
      // Build a clean base URL: strip trailing /api or /api/ from the env variable
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const baseURL = apiURL.replace(/\/api\/?$/, '');
      
      const toURL = (filePath: string) => {
        // Normalize Windows backslashes and strip any leading slashes/dots
        const cleanPath = filePath.replace(/\\/g, '/').replace(/^\.\//, '');
        return `${baseURL}/${cleanPath}`;
      };

      setUserModels(photosRes.data.map((p: {id: string, file_path: string, filename: string}) => ({
        ...p,
        name: p.filename || "Model",
        url: toURL(p.file_path),
        type: "custom"
      })));
      setUserGarments(garmentsRes.data.map((g: {id: string, file_path: string, filename: string, name?: string}) => ({
        ...g,
        name: g.name || g.filename || "Garment",
        url: toURL(g.file_path),
        type: "custom"
      })));

      const fixedHistory = historyRes.data.map((job: TryonHistory) => {
        // Replace any localhost URL with the real backend URL
        if (job.result_url && job.result_url.includes('localhost:8000')) {
          return { ...job, result_url: job.result_url.replace('http://localhost:8000', baseURL) };
        }
        // Handle relative paths stored by backend (no http prefix)
        if (job.result_url && !job.result_url.startsWith('http')) {
          return { ...job, result_url: `${baseURL}/${job.result_url.replace(/^\//, '')}` };
        }
        return job;
      });
      setTryonHistory(fixedHistory);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUserAssets();
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
          fetchUserAssets();
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
    <div className="w-full flex flex-col md:flex-row md:h-[calc(100vh-80px)] min-h-screen bg-[#FAF9F6]">
      
      {/* LEFT PANEL: User Models */}
      <div className="w-full md:w-80 border-r border-black/5 bg-white flex flex-col md:h-full max-h-72 md:max-h-none shrink-0">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-gray-400" />
            Models
          </h2>
          <input type="file" className="hidden" ref={modelInputRef} onChange={handleUploadModel} accept="image/*" />
          <button 
            onClick={() => isAuthenticated ? modelInputRef.current?.click() : router.push("/login")}
            className="text-[10px] uppercase tracking-widest font-bold bg-black text-white px-3 py-2 hover:bg-gray-900 transition-colors flex items-center gap-2"
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
              className={`aspect-[3/4] bg-gray-100 border cursor-pointer transition-all overflow-hidden relative group ${
                selectedModel?.id === model.id ? "border-black shadow-lg scale-[0.98]" : "border-transparent hover:border-black/10"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={model.url} alt={model.name || "Model"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-medium text-white truncate w-full">{model.name || "Custom Upload"}</p>
                {model.type === "custom" && (
                  <button 
                    onClick={(e) => handleDeleteModel(e, model.id)}
                    className="p-1.5 bg-black/80 hover:bg-black text-white rounded transition-colors"
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
      <div className="w-full md:w-80 border-r border-black/5 bg-white flex flex-col md:h-full max-h-72 md:max-h-none shrink-0">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
            <Shirt className="w-4 h-4 text-gray-400" />
            Wardrobe
          </h2>
          <input type="file" className="hidden" ref={garmentInputRef} onChange={handleUploadGarment} accept="image/*" />
          <button 
            onClick={() => isAuthenticated ? garmentInputRef.current?.click() : router.push("/login")}
            className="text-[10px] uppercase tracking-widest font-bold bg-black text-white px-3 py-2 hover:bg-gray-900 transition-colors flex items-center gap-2"
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
              className={`aspect-square bg-gray-100 border cursor-pointer transition-all overflow-hidden relative group ${
                selectedGarment?.id === garment.id ? "border-black shadow-lg scale-[0.98]" : "border-transparent hover:border-black/10"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={garment.url} alt={garment.name || "Garment"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] font-medium text-white truncate w-full">{garment.name || "Custom Upload"}</p>
                {garment.type === "custom" && (
                  <button 
                    onClick={(e) => handleDeleteGarment(e, garment.id)}
                    className="p-1.5 bg-black/80 hover:bg-black text-white rounded transition-colors"
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
      <div className="flex-1 bg-[#F4F3F0] relative flex items-center justify-center overflow-hidden">
        
        {!resultImage ? (
          <div className="flex flex-col items-center justify-center p-8 w-full max-w-lg text-center">
            
            <div className="flex items-center justify-center gap-8 mb-16">
              <div className={`w-36 aspect-[3/4] border transition-all flex items-center justify-center bg-white ${selectedModel ? 'border-black shadow-xl scale-105' : 'border-dashed border-gray-300 text-gray-300'}`}>
                {selectedModel ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedModel.url} alt="Model" className="w-full h-full object-cover" />
                ) : <ImageIcon className="w-8 h-8" />}
              </div>
              
              <div className="text-gray-300 font-light text-4xl">/</div>
              
              <div className={`w-36 aspect-square border transition-all flex items-center justify-center bg-white ${selectedGarment ? 'border-black shadow-xl scale-105' : 'border-dashed border-gray-300 text-gray-300'}`}>
                {selectedGarment ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedGarment.url} alt="Garment" className="w-full h-full object-cover" />
                ) : <Shirt className="w-8 h-8" />}
              </div>
            </div>

            {error && <p className="text-red-500 text-xs mb-6 bg-red-50 py-2 px-4 border border-red-100">{error}</p>}

            {isGenerating ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <div className="w-12 h-12 border-2 border-black/5 border-t-black rounded-full animate-spin mb-6" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-2">Weaving Vision</h3>
                <p className="text-gray-500 text-xs font-sans">Our neural engines are processing your selection.</p>
              </motion.div>
            ) : (
              <div className="w-full space-y-4">
                <button 
                  onClick={handleGenerate}
                  disabled={!selectedModel || !selectedGarment}
                  className={`w-full py-5 font-bold uppercase tracking-widest text-xs transition-all ${
                    selectedModel && selectedGarment
                      ? "bg-black text-white hover:bg-gray-900 shadow-xl"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Generate Virtual Look
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                  <Zap className="w-3 h-3" />
                  Cost: 2 Credits
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center w-full h-full p-12">
            <div className="relative h-[65vh] aspect-[3/4] bg-white border border-black/5 overflow-hidden shadow-2xl mb-10 flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultImage} alt="Generated Look" className="w-full h-full object-cover" />
              <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 border border-black/5 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-black" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-black">AI Masterpiece</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setResultImage(null)} className="flex items-center gap-2 px-8 py-4 bg-white border border-black/10 text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">
                <RefreshCw className="w-3 h-3" /> Reset Studio
              </button>
              <button className="flex items-center gap-2 px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors shadow-xl">
                <Download className="w-3 h-3" /> Export Result
              </button>
            </div>
          </motion.div>
        )}

        {/* RECENT LOOKS STRIP */}
        {tryonHistory.length > 0 && !resultImage && !isGenerating && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-8 w-[90%] max-w-2xl bg-white/80 border border-black/5 p-6 backdrop-blur-md shadow-2xl">
            <h3 className="text-[10px] font-bold text-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3"/> 
              Recent Creations
            </h3>
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
              {tryonHistory.map((job: TryonHistory) => (
                <div 
                  key={job.id} 
                  onClick={() => setResultImage(job.result_url)} 
                  className="w-20 aspect-[3/4] shrink-0 bg-gray-100 border border-transparent cursor-pointer hover:border-black transition-all relative group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={job.result_url} alt="History" className="w-full h-full object-cover" />
                  <button 
                    onClick={(e) => handleDeleteHistory(e, job.id)}
                    className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-black text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
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
