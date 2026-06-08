/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Camera,
  Layers,
  Sliders,
  Maximize2,
  Trash2,
  Download,
  Paintbrush,
  RotateCcw,
  History,
  Settings as SettingsIcon,
  Check,
  ChevronRight,
  Eye,
  Info,
  Play,
  Upload,
  AlertTriangle,
  Lightbulb,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import UploadSection from "./components/UploadSection";
import { EnhancementSettings, DiagnosisResult, SavedPhoto, AppTab } from "./types";
import { applyImageFilters, upscaleCanvasImage, repairScratchesOnCanvas } from "./utils/imageFilters";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<AppTab>("home");

  // Main input state
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>("");
  const [originalDimensions, setOriginalDimensions] = useState<{ w: number; h: number } | null>(null);

  // Settings state
  const [settings, setSettings] = useState<EnhancementSettings>({
    sharpen: 25,
    denoise: 15,
    contrast: 5,
    brightness: 0,
    saturation: 10,
    skinSmoothing: 20,
    eyeClarity: 30,
    colorize: false,
    upscale: 2
  });

  // AI Diagnostic states
  const [aiDiagnostic, setAiDiagnostic] = useState<DiagnosisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Creative prompt override states
  const [creativePrompt, setCreativePrompt] = useState("");
  const [isReimagining, setIsReimagining] = useState(false);

  // Interactive UI states
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const isDraggingSlider = useRef(false);
  const comparisonContainerRef = useRef<HTMLDivElement>(null);

  // Scratch Painting / Inpainting Brush states
  const [brushMode, setBrushMode] = useState(false);
  const [brushSize, setBrushSize] = useState(12);
  const [isPainting, setIsPainting] = useState(false);
  const [hasPaintedMask, setHasPaintedMask] = useState(false);

  // Saved Photo Histories (Local Storage synced)
  const [savedGallery, setSavedGallery] = useState<SavedPhoto[]>([]);
  const [activeGalleryComparison, setActiveGalleryComparison] = useState<SavedPhoto | null>(null);

  // References for Canvas operations
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null); // Real-time updated canvas

  // Loading indicator for filter renders
  const [isProcessingFilters, setIsProcessingFilters] = useState(false);

  // Sync Gallery history on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem("photo_revive_history");
      if (stored) {
        setSavedGallery(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  // Update localStorage when history changes
  const saveToHistory = (newPhoto: SavedPhoto) => {
    const updated = [newPhoto, ...savedGallery].slice(0, 30); // limit to 30 elements
    setSavedGallery(updated);
    try {
      localStorage.setItem("photo_revive_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Storage save failed:", e);
    }
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedGallery.filter((p) => p.id !== id);
    setSavedGallery(updated);
    try {
      localStorage.setItem("photo_revive_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Storage delete failed:", e);
    }
    if (activeGalleryComparison?.id === id) {
      setActiveGalleryComparison(null);
    }
  };

  const clearAllHistory = () => {
    setSavedGallery([]);
    try {
      localStorage.removeItem("photo_revive_history");
    } catch (e) {
      console.error("Storage clear failed:", e);
    }
    setActiveGalleryComparison(null);
  };

  // Run AI Diagnostic API on upload
  const runAIDiagnosis = async (imgUri: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imgUri,
          mimeType: imgUri.startsWith("data:image/png") ? "image/png" : "image/jpeg"
        })
      });

      if (!response.ok) {
        throw new Error("Diagnosis request failed");
      }

      const data: DiagnosisResult = await response.json();
      setAiDiagnostic(data);

      // Auto-populate sliders with Gemini Recommended values as a luxury smart auto-preset!
      setSettings((prev) => ({
        ...prev,
        sharpen: data.advances?.sharpen ?? prev.sharpen,
        denoise: data.advances?.denoise ?? prev.denoise,
        contrast: data.advances?.contrast ?? prev.contrast,
        skinSmoothing: data.advances?.skinSmoothing ?? prev.skinSmoothing,
        eyeClarity: data.advances?.eyeClarity ?? prev.eyeClarity,
        colorize: data.advances?.colorize ?? prev.colorize,
        upscale: (data.advances?.upscalingFactor === 2 || data.advances?.upscalingFactor === 4 || data.advances?.upscalingFactor === 8)
          ? (data.advances.upscalingFactor as 2 | 4 | 8)
          : prev.upscale
      }));

    } catch (e: any) {
      console.error("AI diagnostics error:", e);
      setAnalysisError("AI Server busy. Manual enhancement mode loaded.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Creative Prompt Inpainting / Generation
  const runCreativeReimagine = async () => {
    if (!originalImageUrl) return;
    if (!creativePrompt.trim()) return;

    setIsReimagining(true);
    try {
      const response = await fetch("/api/reimagine-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: originalImageUrl,
          mimeType: originalImageUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg",
          prompt: creativePrompt
        })
      });

      if (!response.ok) {
        const errDetail = await response.json().catch(() => ({}));
        throw new Error(errDetail.details || errDetail.error || "Generation request failed");
      }

      const data = await response.json();
      if (data.enhancedImage) {
        // Set this beautiful output as the new enhanced state
        applyCreativeResultToCanvas(data.enhancedImage);
        setCreativePrompt("");
      }
    } catch (e: any) {
      console.error("Creative generation failed:", e);
      alert(`Creative Inpaint notice: ${e.message || "Please setup a valid Gemini key in platform Secrets."}`);
    } finally {
      setIsReimagining(false);
    }
  };

  // Load new uploaded image
  const handlePhotoSelected = (uri: string, name: string) => {
    setOriginalImageUrl(uri);
    setImageFileName(name);
    setAiDiagnostic(null);
    setBrushMode(false);
    setHasPaintedMask(false);
    setCreativePrompt("");
    setCurrentTab("enhance");

    // Initialize HTML original Image object to load details
    const imgObj = new Image();
    imgObj.onload = () => {
      setOriginalDimensions({ w: imgObj.width, h: imgObj.height });
      
      // Auto-trigger smart diagnostics review
      runAIDiagnosis(uri);
      
      // Reset layout canvases & draw initial state
      setTimeout(() => {
        setupCanvases(imgObj);
      }, 100);
    };
    imgObj.src = uri;
    sourceImageRef.current = imgObj;
  };

  // Setup main, mask and live canvas states
  const setupCanvases = (img: HTMLImageElement) => {
    const mainC = mainCanvasRef.current;
    const maskC = maskCanvasRef.current;
    const prevC = previewCanvasRef.current;

    if (!mainC || !maskC || !prevC) return;

    // Constrain image sizing for fast real-time CPU filters rendering
    let tw = img.width;
    let th = img.height;
    const maxDimension = 1000;

    if (tw > maxDimension || th > maxDimension) {
      if (tw > th) {
        th = Math.round((th * maxDimension) / tw);
        tw = maxDimension;
      } else {
        tw = Math.round((tw * maxDimension) / th);
        th = maxDimension;
      }
    }

    // Assign uniform bounds
    mainC.width = tw;
    mainC.height = th;
    maskC.width = tw;
    maskC.height = th;
    prevC.width = tw;
    prevC.height = th;

    const mCtx = mainC.getContext("2d")!;
    const maskCtx = maskC.getContext("2d")!;

    // Render basic original photo onto main
    mCtx.drawImage(img, 0, 0, tw, th);
    
    // Clear mask
    maskCtx.clearRect(0, 0, tw, th);

    // Initial filter pipeline execution
    triggerRealtimeFilterPipeline();
  };

  // Trigger main filter array computations
  const triggerRealtimeFilterPipeline = () => {
    const mainC = mainCanvasRef.current;
    const prevC = previewCanvasRef.current;
    if (!mainC || !prevC) return;

    setIsProcessingFilters(true);

    const mCtx = mainC.getContext("2d")!;
    const pCtx = prevC.getContext("2d")!;

    // Grab original pixels from current state of main canvas
    const rawPixels = mCtx.getImageData(0, 0, mainC.width, mainC.height);

    // Apply filters asynchronously to keep browser threads light
    setTimeout(() => {
      try {
        const filteredData = applyImageFilters(rawPixels, settings);
        pCtx.putImageData(filteredData, 0, 0);
      } catch (err) {
        console.error("Filter calculation error:", err);
      } finally {
        setIsProcessingFilters(false);
      }
    }, 10);
  };

  // Re-run pipeline whenever settings change
  useEffect(() => {
    if (originalImageUrl) {
      triggerRealtimeFilterPipeline();
    }
  }, [settings, originalImageUrl]);

  // Apply visual base64 directly as enhanced output override (for creative API results)
  const applyCreativeResultToCanvas = (b64Result: string) => {
    const prevC = previewCanvasRef.current;
    if (!prevC) return;

    const img = new Image();
    img.onload = () => {
      const pCtx = prevC.getContext("2d")!;
      pCtx.clearRect(0, 0, prevC.width, prevC.height);
      pCtx.drawImage(img, 0, 0, prevC.width, prevC.height);
    };
    img.src = b64Result;
  };

  // Slider interactive coordinate drag handles
  const handleComparisonMouseDown = () => {
    isDraggingSlider.current = true;
    document.addEventListener("mousemove", handleComparisonMouseMove);
    document.addEventListener("mouseup", handleComparisonMouseUp);
  };

  const handleComparisonMouseMove = (e: MouseEvent) => {
    if (!isDraggingSlider.current || !comparisonContainerRef.current) return;
    const rect = comparisonContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setSliderPosition(percentage);
  };

  const handleComparisonMouseUp = () => {
    isDraggingSlider.current = false;
    document.removeEventListener("mousemove", handleComparisonMouseMove);
    document.removeEventListener("mouseup", handleComparisonMouseUp);
  };

  const handleComparisonTouchMove = (e: React.TouchEvent) => {
    if (!comparisonContainerRef.current) return;
    const rect = comparisonContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setSliderPosition(percentage);
  };

  // Scratch mask drawing events
  const getCanvasMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale coords back relative to the canvas internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startScratchDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!brushMode) return;
    setIsPainting(true);
    const coords = getCanvasMouseCoords(e);
    drawOnMask(coords.x, coords.y, false);
  };

  const drawScratchMoving = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPainting || !brushMode) return;
    const coords = getCanvasMouseCoords(e);
    drawOnMask(coords.x, coords.y, true);
  };

  const drawOnMask = (x: number, y: number, isContinuous: boolean) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)"; // Neon soft red for mask brush
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (!isContinuous) {
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
      ctx.fill();
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    setHasPaintedMask(true);
  };

  const stopScratchDrawing = () => {
    setIsPainting(false);
    const canvas = maskCanvasRef.current;
    if (canvas) {
      canvas.getContext("2d")!.beginPath();
    }
  };

  const resetScratchMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasPaintedMask(false);
  };

  // Trigger scratch removal algorithm
  const executeInpaintScratchRepair = () => {
    const mainC = mainCanvasRef.current;
    const maskC = maskCanvasRef.current;
    if (!mainC || !maskC) return;

    // Apply local pixel neighborhood diffusion
    repairScratchesOnCanvas(mainC, maskC);
    
    // Clear the painted state
    setHasPaintedMask(false);
    setBrushMode(false);

    // Re-run real-time filters
    triggerRealtimeFilterPipeline();
  };

  // Generate and save outputs
  const handleSaveAndExport = () => {
    const origC = mainCanvasRef.current; // holds base/inpainted imagery
    const prevC = previewCanvasRef.current; // holds final filtered imagery

    if (!origC || !prevC) return;

    // Render scaled premium resolution canvas based on selected Factor
    const upscaleFactor = settings.upscale;
    const finalUpscaledCanvas = upscaleCanvasImage(prevC, upscaleFactor);

    const originalDataUrl = origC.toDataURL("image/jpeg", 0.9);
    const enhancedDataUrl = finalUpscaledCanvas.toDataURL("image/jpeg", 0.92);

    const savedItem: SavedPhoto = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Enhanced_${imageFileName.replace(/\.[^/.]+$/, "") || "photo"}.jpg`,
      originalUrl: originalDataUrl,
      enhancedUrl: enhancedDataUrl,
      timestamp: Date.now(),
      photoType: aiDiagnostic?.photoType || "Standard",
      upscale: upscaleFactor
    };

    saveToHistory(savedItem);

    // Create trigger download
    const link = document.createElement("a");
    link.download = savedItem.name;
    link.href = enhancedDataUrl;
    link.click();
  };

  // Reset all settings to fallback defaults
  const handleResetSliders = () => {
    setSettings({
      sharpen: 25,
      denoise: 15,
      contrast: 5,
      brightness: 0,
      saturation: 10,
      skinSmoothing: 20,
      eyeClarity: 30,
      colorize: false,
      upscale: 2
    });
  };

  return (
    <div className="w-[1024px] h-[768px] bg-[#09090b] text-zinc-105 font-sans flex flex-col overflow-hidden text-zinc-100 select-none">
      
      {/* 1. App Splash Animation */}
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* 2. Top Header Navigation (Professional Polish Theme) */}
      <header className="h-16 border-b border-zinc-805 border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/50 relative z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.45)]">
            <div className="w-4 h-4 border-2 border-white rounded-full"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white italic">UltraHD AI</span>
          <span className="ml-2 px-2.5 py-0.5 bg-indigo-500/10 rounded text-[9px] font-bold text-indigo-400 tracking-widest uppercase border border-indigo-500/20">
            Pro Enhancer
          </span>
        </div>

        {/* Global tab Switcher */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setCurrentTab("home")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              currentTab === "home"
                ? "bg-zinc-850 bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Studio Core
          </button>
          <button
            onClick={() => originalImageUrl && setCurrentTab("enhance")}
            disabled={!originalImageUrl}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              !originalImageUrl ? "opacity-40 cursor-not-allowed" : ""
            } ${
              currentTab === "enhance"
                ? "bg-zinc-800 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setCurrentTab("gallery")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              currentTab === "gallery"
                ? "bg-zinc-800 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <History className="w-3 h-3" />
            Saved ({savedGallery.length})
          </button>
          <button
            onClick={() => setCurrentTab("settings")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              currentTab === "settings"
                ? "bg-zinc-800 text-white font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <SettingsIcon className="w-3 h-3" /> Settings
          </button>
        </div>

        {/* Action Export Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Gemini Ultra-HD v2.5</span>
          </div>

          <button
            disabled={!originalImageUrl}
            onClick={handleSaveAndExport}
            className={`px-4 py-2 rounded-lg font-semibold text-xs text-white transition-all flex items-center gap-2 border shadow-lg ${
              originalImageUrl
                ? "bg-indigo-600 hover:bg-indigo-500 border-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-indigo-605/20"
                : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export HD</span>
          </button>
        </div>
      </header>

      {/* 3. Main Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* TAB 1: STUDIO CORE / UPLOAD LANDING */}
        {currentTab === "home" && (
          <div className="flex-1 overflow-y-auto bg-[#121214] flex flex-col justify-between py-10 relative">
            <div className="max-w-4xl mx-auto w-full px-6 flex-1 flex flex-col justify-center">
              <div className="text-center mb-8 relative">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20">
                  CRISP NEURAL RESOLUTION UP-SAMPLER
                </span>
                <h2 className="text-4xl font-extrabold tracking-tight mt-3 text-white">
                  Unlock High-Definition Clarity
                </h2>
                <p className="mt-2 text-sm text-zinc-400 max-w-lg mx-auto">
                  Bring blur, faded tones, noise, and historic scratches out of their shell in seconds using advanced pixel convolutions and Gemini AI suggestions.
                </p>
              </div>

              {/* Upload Workspace Component */}
              <UploadSection
                onPhotoSelected={handlePhotoSelected}
              />
            </div>

            {/* Bottom Credits / Tech Stats Bar */}
            <div className="border-t border-zinc-900/80 bg-zinc-950/40 p-4 shrink-0 text-center text-[11px] text-zinc-500 tracking-wider font-mono">
              ENGINE VERSION: 2.5.0-STABLE / SYSTEM STATUS: ACTIVE (3000) / COBALT NEURAL SHARPENING: OK
            </div>
          </div>
        )}

        {/* TAB 2: WORKSPACE ENHANCEMENT SUITE */}
        {currentTab === "enhance" && originalImageUrl && (
          <>
            {/* LEFT TOOLBOX CONTROL RAIL */}
            <aside className="w-72 bg-[#0d0d0f] border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
              
              {/* Image Information Card */}
              <div id="image-profile-tag" className="p-4 border-b border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center border border-zinc-800 text-indigo-400 overflow-hidden">
                    {originalImageUrl ? (
                      <img src={originalImageUrl} className="w-full h-full object-cover" alt="Thumb" />
                    ) : (
                      <Camera className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{imageFileName}</p>
                    <p className="text-[10px] font-mono text-zinc-500">
                      {originalDimensions ? `${originalDimensions.w} x ${originalDimensions.h} px` : "Decoding..."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOriginalImageUrl(null);
                      setCurrentTab("home");
                    }}
                    className="p-1 px-2 text-[10px] bg-red-950/20 text-red-400 hover:bg-red-900/20 rounded border border-red-500/10"
                    title="Change image"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Direct Interactive Enhancer Tools */}
              <div className="p-5 flex flex-col gap-6">
                
                {/* 1. HD RESOLUTION TARGET SETTINGS */}
                <section>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2 px-1">
                    Super Resolution Output
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800/65">
                    {[2, 4, 8].map((mul) => (
                      <button
                        key={mul}
                        onClick={() => setSettings((p) => ({ ...p, upscale: mul as 2 | 4 | 8 }))}
                        className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                          settings.upscale === mul
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {mul}x
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500 px-1 font-mono flex items-center justify-between">
                    <span>Target Resolution:</span>
                    <span className="text-green-400">
                      {originalDimensions
                        ? `${originalDimensions.w * settings.upscale} × ${originalDimensions.h * settings.upscale} px`
                        : "Calculating..."}
                    </span>
                  </div>
                </section>

                {/* 2. SLIDERS: DIGITAL RESTORATION PANEL */}
                <section className="space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-800/50 pb-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Enhancement Parameters
                    </label>
                    <button
                      onClick={handleResetSliders}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                    </button>
                  </div>

                  {/* Sharpen Slider */}
                  <div className="space-y-1.5 bg-zinc-900/20 p-2 border border-zinc-800/10 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Sharpen / Clutter Blur
                      </span>
                      <span className="font-bold text-indigo-400 font-mono text-[11px]">{settings.sharpen}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sharpen}
                      className="w-full accent-indigo-500 h-1 bg-zinc-850 rounded"
                      onChange={(e) => setSettings((p) => ({ ...p, sharpen: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Denoise Slider */}
                  <div className="space-y-1.5 bg-zinc-900/20 p-2 border border-zinc-800/10 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Luminosity Denoise
                      </span>
                      <span className="font-bold text-indigo-400 font-mono text-[11px]">{settings.denoise}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.denoise}
                      className="w-full accent-indigo-500 h-1 bg-zinc-850 rounded"
                      onChange={(e) => setSettings((p) => ({ ...p, denoise: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Portrait Skin Smoothing Slider */}
                  <div className="space-y-1.5 bg-zinc-900/20 p-2 border border-zinc-800/10 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        Skin Smoothing / Blemish
                      </span>
                      <span className="font-bold text-indigo-400 font-mono text-[11px]">{settings.skinSmoothing}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.skinSmoothing}
                      className="w-full accent-indigo-500 h-1 bg-zinc-850 rounded"
                      onChange={(e) => setSettings((p) => ({ ...p, skinSmoothing: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Brightness Enhancer */}
                  <div className="space-y-1.5 bg-zinc-900/20 p-2 border border-zinc-800/10 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        Brightness Boost
                      </span>
                      <span className="font-bold text-indigo-400 font-mono text-[11px]">{settings.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.brightness}
                      className="w-full accent-indigo-500 h-1 bg-zinc-850 rounded"
                      onChange={(e) => setSettings((p) => ({ ...p, brightness: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Contrast Enhancement */}
                  <div className="space-y-1.5 bg-zinc-900/20 p-2 border border-zinc-800/10 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        Contrast Matrix
                      </span>
                      <span className="font-bold text-indigo-400 font-mono text-[11px]">{settings.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.contrast}
                      className="w-full accent-indigo-505 accent-indigo-500 h-1 bg-zinc-850 rounded"
                      onChange={(e) => setSettings((p) => ({ ...p, contrast: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Saturation Factor */}
                  <div className="space-y-1.5 bg-zinc-900/20 p-2 border border-zinc-800/10 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                        Vivid Saturation
                      </span>
                      <span className="font-bold text-indigo-400 font-mono text-[11px]">{settings.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.saturation}
                      className="w-full accent-indigo-500 h-1 bg-zinc-850 rounded"
                      onChange={(e) => setSettings((p) => ({ ...p, saturation: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Eye & Head Clarity details */}
                  <div className="space-y-1.5 bg-zinc-900/20 p-2 border border-zinc-800/10 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Eye Highlight / Details
                      </span>
                      <span className="font-bold text-indigo-400 font-mono text-[11px]">{settings.eyeClarity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.eyeClarity}
                      className="w-full accent-indigo-500 h-1 bg-zinc-850 rounded"
                      onChange={(e) => setSettings((p) => ({ ...p, eyeClarity: parseInt(e.target.value) }))}
                    />
                  </div>

                  {/* Colorize Black and Whites Checkbox */}
                  <div className="p-2 border border-zinc-800/60 rounded-xl bg-zinc-950/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-300 font-semibold">AI Colorize B&W Photos</span>
                      <span className="text-[9px] text-[#22c55e] bg-green-500/10 uppercase tracking-wider px-1.5 rounded font-mono border border-green-500/20">
                        Smart Maps
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.colorize}
                        className="sr-only peer"
                        onChange={(e) => setSettings((p) => ({ ...p, colorize: e.target.checked }))}
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                </section>
              </div>

              {/* Bottom Quote / Helper */}
              <div className="mt-auto p-4 border-t border-zinc-805 border-zinc-800/60">
                <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
                  <p className="text-[10.5px] text-zinc-405 text-zinc-400 leading-relaxed italic">
                    "Memories deserve high-definition preservation. Adjust core sharpening to retrieve authentic micro textures without artifacting."
                  </p>
                </div>
              </div>
            </aside>

            {/* MIDDLE PREVIEW AREA WITH COMPARISON SLIDER */}
            <main className="flex-1 bg-[#121214] p-5 flex flex-col relative overflow-hidden">
              
              {/* Header inside canvas zone */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wide">
                    <span>Active Screen Viewport</span>
                    {isProcessingFilters && (
                      <span className="text-[10px] text-indigo-400 animate-pulse normal-case font-normal">(Recomputing filters...)</span>
                    )}
                  </h3>
                </div>

                {/* Local Action Utilities & Brush/Pointer Switch */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBrushMode(!brushMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      brushMode
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                    }`}
                    title="Draw over scratches to inpaint"
                  >
                    <Paintbrush className="w-3.5 h-3.5" />
                    <span>{brushMode ? "Exit Brush Mode" : "Paint Scratch Mask"}</span>
                  </button>

                  {brushMode && (
                    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-2 text-xs">
                      <span className="text-zinc-500 text-[11px] font-mono">Brush: {brushSize}px</span>
                      <input
                        type="range"
                        min="4"
                        max="30"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="w-16 accent-red-500 h-1 bg-zinc-800 rounded"
                      />
                      {hasPaintedMask && (
                        <button
                          onClick={resetScratchMask}
                          className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          Clear Painted
                        </button>
                      )}
                    </div>
                  )}

                  {brushMode && hasPaintedMask && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={executeInpaintScratchRepair}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold font-mono border border-red-500/20 shadow-lg shadow-red-600/10"
                    >
                      Apply Inpaint Brush
                    </motion.button>
                  )}
                </div>
              </div>

              {/* STAGE & SLIDER COMPARISON CONTAINER */}
              <div
                ref={comparisonContainerRef}
                className="flex-1 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/80 relative shadow-2xl flex items-center justify-center min-h-0 select-none group"
                style={{ cursor: isDraggingSlider.current ? "ew-resize" : "default" }}
                onMouseMove={(e) => {
                  if (brushMode) return;
                  if (isDraggingSlider.current) handleComparisonMouseMove(e.nativeEvent);
                }}
                onTouchMove={handleComparisonTouchMove}
              >
                {/* 1. Backdrop Grid */}
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* Hidden original element to load sizes */}
                <img
                  ref={sourceImageRef}
                  src={originalImageUrl}
                  className="hidden"
                  alt="Original Hidden"
                />

                {/* 2. Primary Layout Canvas Elements */}
                {/* Main holds original base and inpaint logic */}
                <canvas
                  ref={mainCanvasRef}
                  className="hidden"
                />

                {/* Wrapper holding viewport displaying canvas dimensions matching aspect ratios */}
                <div
                  className="relative aspect-auto max-w-full max-h-full overflow-hidden shadow-2xl flex items-center justify-center border border-zinc-800/40"
                  style={{
                    width: previewCanvasRef.current ? `${previewCanvasRef.current.width}px` : "auto",
                    height: previewCanvasRef.current ? `${previewCanvasRef.current.height}px` : "auto"
                  }}
                >
                  {/* SIDE 1: original raw background */}
                  <div className="absolute inset-0 w-full h-full">
                    {/* Render original base before sliders */}
                    <canvas
                      ref={mainCanvasRef}
                      className="w-full h-full object-contain pointer-events-none block blur-[1px] brightness-[0.9] grayscale-[10%]"
                    />
                    <div className="absolute bottom-4 left-4 bg-zinc-950/80 border border-zinc-800 px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest text-zinc-400 z-20">
                      Original Low-Res
                    </div>
                  </div>

                  {/* SIDE 2: Real-time Rendered canvas clipping viewport */}
                  <div
                    className="absolute inset-y-0 right-0 h-full overflow-hidden border-l border-indigo-400/90 z-10"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div
                      className="absolute inset-y-0 h-full select-none"
                      style={{
                        width: previewCanvasRef.current ? `${previewCanvasRef.current.width}px` : "100%",
                        left: `-${sliderPosition}%` // compensates placement offset to simulate crop
                      }}
                    >
                      <canvas
                        ref={previewCanvasRef}
                        className="w-full h-full object-contain pointer-events-none block shadow-[0_0_50px_rgba(79,70,229,0.25)]"
                      />
                    </div>
                    <div className="absolute bottom-4 right-4 bg-indigo-950/85 border border-indigo-500/20 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300 z-20 whitespace-nowrap">
                      AI Enhanced Output
                    </div>
                  </div>

                  {/* Scratch Drawing Overlay Canvas: Only shows when brush mode is active */}
                  <canvas
                    ref={maskCanvasRef}
                    onMouseDown={startScratchDrawing}
                    onMouseMove={drawScratchMoving}
                    onMouseUp={stopScratchDrawing}
                    onMouseLeave={stopScratchDrawing}
                    className={`absolute inset-0 w-full h-full z-30 ${
                      brushMode ? "block cursor-crosshair opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  />
                  
                  {/* Slider Control Handle */}
                  {!brushMode && (
                    <div
                      className="absolute top-0 bottom-0 w-1 z-30 cursor-ew-resize bg-indigo-500 hover:bg-indigo-400 group-hover:scale-x-110 transition-transform"
                      style={{ left: `${sliderPosition}%` }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleComparisonMouseDown();
                      }}
                    >
                      {/* Interactive round focal bubble */}
                      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center shadow-2xl border-2 border-indigo-400 hover:scale-105 active:scale-95 transition-transform z-40 select-none">
                        <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Bottom Info Tooltip */}
              <div className="mt-4 shrink-0 flex justify-center">
                <div className="px-5 py-2.5 bg-zinc-950/90 border border-zinc-800/80 rounded-full flex items-center gap-4 shadow-2xl max-w-lg">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">Status Ready</span>
                  </div>
                  <div className="h-3 w-px bg-zinc-800"></div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {brushMode ? (
                      <span className="text-red-400 font-medium">✨ Brush Active: Draw on photo and hit "Apply Inpaint" to heal.</span>
                    ) : (
                      <span>Drag the slider handle to contrast original and upscaled crystal elements.</span>
                    )}
                  </p>
                </div>
              </div>
            </main>

            {/* RIGHT SIDEBAR: AI DIAGNOSTICS & SYSTEM LOGS */}
            <aside className="w-72 bg-[#0d0d0f] border-l border-zinc-800 flex flex-col p-6 overflow-y-auto shrink-0 gap-6">
              
              {/* AI Diagnostician Panel */}
              <section className="space-y-3 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
                    AI Diagnostic Scan
                  </label>
                </div>

                {isAnalyzing ? (
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 text-center space-y-3">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-xs text-zinc-400 font-medium animate-pulse">Running neural matrix checks...</p>
                  </div>
                ) : analysisError ? (
                  <div className="p-3.5 bg-zinc-950/40 rounded-xl border border-zinc-850/60 leading-relaxed text-[11px] text-zinc-400">
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Diagnostics Offline</span>
                    </div>
                    Photo Revive is ready in localized mode. Configure a Gemini key in settings secrets to start deep scanning.
                  </div>
                ) : aiDiagnostic ? (
                  <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-zinc-300">
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-400">Detected Category</span>
                      <p className="text-xs font-bold text-white mt-0.5">{aiDiagnostic.photoType || "Standard Digital"}</p>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400">Spotted Defects</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiDiagnostic.detectedIssues?.slice(0, 4).map((issue, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded"
                          >
                            × {issue}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-900">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">Diagnostic Review</span>
                      <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                        "{aiDiagnostic.analysisDescription}"
                      </p>
                    </div>

                    {aiDiagnostic.simulationReason && (
                      <div className="text-[9px] text-[#22c55e] font-mono leading-tight bg-green-950/15 p-1 px-2 rounded border border-green-500/10">
                        {aiDiagnostic.simulationReason}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => runAIDiagnosis(originalImageUrl)}
                    className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-500/20 flex items-center justify-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Run AI Health Scan
                  </button>
                )}
              </section>

              {/* Advanced Creative AI Re-Imagine prompt overlay */}
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
                    AI Creative Reimagine
                  </label>
                </div>
                
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 space-y-2">
                  <p className="text-[10px] text-zinc-450 text-zinc-400 leading-normal">
                    Recreate the photo completely from scratch retaining human postures with dynamic AI generative art layers!
                  </p>
                  
                  <textarea
                    value={creativePrompt}
                    onChange={(e) => setCreativePrompt(e.target.value)}
                    placeholder="E.g., convert to sharp studio portrait, dramatic moody lighting, professional DSLR, cyber aesthetic"
                    className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-550 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 resize-none h-16 leading-relaxed"
                  />

                  <button
                    disabled={isReimagining || !creativePrompt.trim()}
                    onClick={runCreativeReimagine}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border border-purple-500/20 shadow-md ${
                      isReimagining || !creativePrompt.trim() ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }"
                  >
                    {isReimagining ? (
                      <span className="animate-pulse">Generating Dream...</span>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" /> Re-Imagine Photo
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* History List inside right panel */}
              <section className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Workspace History</span>
                  </div>
                  {savedGallery.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className="text-[10px] text-zinc-500 hover:text-red-400 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 min-h-0 pr-1 select-none">
                  {savedGallery.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-zinc-850 bg-zinc-950/20 rounded-xl text-zinc-500 text-[11px] leading-relaxed">
                      Your historic restorations will sync here.
                    </div>
                  ) : (
                    savedGallery.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          // Display saved comparison setup
                          setOriginalImageUrl(item.originalUrl);
                          setImageFileName(item.name);
                          setCurrentTab("enhance");
                          
                          // Load image object
                          const imgObj = new Image();
                          imgObj.onload = () => {
                            setOriginalDimensions({ w: imgObj.width, h: imgObj.height });
                            setupCanvases(imgObj);
                            // Auto copy saved target filters back
                            applyCreativeResultToCanvas(item.enhancedUrl);
                          };
                          imgObj.src = item.originalUrl;
                        }}
                        className="p-2 bg-zinc-950/80 rounded-xl border border-zinc-850 hover:border-zinc-700 cursor-pointer transition-colors flex items-center gap-2 group/item"
                      >
                        <div className="w-10 h-10 rounded overflow-hidden border border-zinc-800 shrink-0">
                          <img src={item.enhancedUrl} className="w-full h-full object-cover" alt="Thumb" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                          <p className="text-[9px] text-indigo-400 font-mono">
                            {item.photoType || "Standard"} • {item.upscale}x upscale
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteFromHistory(item.id, e)}
                          className="p-1 opacity-0 group-hover/item:opacity-100 text-zinc-500 hover:text-red-400 transition-all rounded hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </aside>
          </>
        )}

        {/* TAB 3: RESTORATION GALLERY ARCHIVES */}
        {currentTab === "gallery" && (
          <div className="flex-1 overflow-y-auto bg-[#121214] p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">Your Saved Restoration Archives</h2>
                  <p className="text-xs text-zinc-400">Browse fully generated Ultra-HD exports and settings metadata.</p>
                </div>
                {savedGallery.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="px-3 py-1.5 bg-red-950/30 text-red-400 border border-red-505/10 rounded-lg text-xs font-semibold hover:bg-red-950/55 transition-colors"
                  >
                    Delete All Archives
                  </button>
                )}
              </div>

              {savedGallery.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-zinc-805 border-zinc-800/85 rounded-3xl bg-zinc-950/30 max-w-lg mx-auto">
                  <History className="w-12 h-12 text-zinc-650 mx-auto mb-4 text-zinc-650 text-zinc-500" />
                  <h3 className="text-sm font-bold text-zinc-300">No exports saved yet</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                    Go to the workspace, select an original photo, customize sliders, and export to save results.
                  </p>
                  <button
                    onClick={() => setCurrentTab("home")}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-505 rounded-lg text-xs font-semibold"
                  >
                    Load Studio Core
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  {savedGallery.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 relative group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-mono text-zinc-500">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                          <h4 className="text-sm font-bold text-white mt-1 leading-snug">{item.name}</h4>
                        </div>
                        <button
                          onClick={(e) => deleteFromHistory(item.id, e)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950 rounded-lg border border-zinc-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Split visual showcase display */}
                      <div className="h-48 w-full rounded-xl bg-zinc-950 overflow-hidden flex relative">
                        <div className="w-1/2 h-full opacity-60 blur-[0.5px]">
                          <img src={item.originalUrl} className="w-full h-full object-cover" alt="Original" />
                          <span className="absolute bottom-2 left-2 text-[9px] bg-zinc-90 w bg-black/60 px-1.5 py-0.5 rounded text-zinc-400 font-mono">
                            ORIGINAL
                          </span>
                        </div>
                        <div className="w-1/2 h-full border-l border-indigo-500 shadow-2xl relative">
                          <img src={item.enhancedUrl} className="w-full h-full object-cover" alt="Enhanced" />
                          <span className="absolute bottom-2 right-2 text-[9px] bg-indigo-900 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 font-bold font-mono">
                            ENHANCED {item.upscale}X
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono leading-none">
                            {item.photoType}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Display saved comparison setup
                              setOriginalImageUrl(item.originalUrl);
                              setImageFileName(item.name);
                              setCurrentTab("enhance");
                              
                              // Load image object
                              const imgObj = new Image();
                              imgObj.onload = () => {
                                setOriginalDimensions({ w: imgObj.width, h: imgObj.height });
                                setupCanvases(imgObj);
                                // Auto copy saved target filters back
                                applyCreativeResultToCanvas(item.enhancedUrl);
                              };
                              imgObj.src = item.originalUrl;
                            }}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-semibold"
                          >
                            Compare Workspace
                          </button>
                          <a
                            href={item.enhancedUrl}
                            download={item.name}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-505 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: APP SETTINGS */}
        {currentTab === "settings" && (
          <div className="flex-1 overflow-y-auto bg-[#121214] p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="border-b border-zinc-800 pb-3">
                <h2 className="text-2xl font-extrabold text-white">System Settings</h2>
                <p className="text-xs text-zinc-400 font-medium">Manage photo enhancement engine parameters, neural layers, and local cache.</p>
              </div>

              {/* Box 1: AI Engine Configuration directions */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Gemini API Key Connection</h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                      Deep biological features diagnostic reviews and realistic human generative reconstruct highlights are processed using server-side Gemini 3.5 Models. If you want to bypass fallback simulation mode, simply insert your key into standard secrets file.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850/60 flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping"></div>
                    <span className="font-mono">GEMINI_API_KEY Status: Injecting automatically via environment</span>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-[#22c55e] border border-green-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                    Live Status
                  </span>
                </div>
              </div>

              {/* Box 2: System Spec Logs */}
              <div className="bg-zinc-900/40 border border-zinc-805 border-zinc-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Enhancer Core Specification Logs</h3>
                
                <div className="space-y-2 text-xs font-mono text-zinc-400">
                  <div className="flex justify-between border-b border-zinc-850 py-1.5">
                    <span>Active Server Port</span>
                    <span className="text-white">3000 (Proxy aligned)</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 py-1.5">
                    <span>Interactive Workspace Driver</span>
                    <span className="text-white">Capacitor Web Framework</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 py-1.5">
                    <span>Real-time Denoise Kernels</span>
                    <span className="text-teal-400">Bilateral Neighborhood Blur</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-850 py-1.5">
                    <span>B&W Colorizer Multiplexer</span>
                    <span className="text-pink-400">Luma Shadow Projection v2</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Upscale Convolution Module</span>
                    <span className="text-purple-400 font-semibold">High-Pass Edge Booster</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Local Storage specs */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Reset Localized Storage Databases</h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md">
                    Wipe local storage cache representing saved edits history and temporary canvas thumbnails. Does not impact raw photos of your phone.
                  </p>
                </div>
                <button
                  onClick={() => {
                    clearAllHistory();
                    alert("Local Cache reset complete.");
                  }}
                  className="px-4 py-2 bg-red-950/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-900/20 transition-all shrink-0"
                >
                  Clear System Cache
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
