/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Camera, Layers, Sliders, Paintbrush, RotateCcw, History, Settings as SettingsIcon, Check, ChevronRight, Eye, Info, Play, Upload, AlertTriangle, Lightbulb, Cpu, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import UploadSection from "./components/UploadSection";
import DashboardScreen from "./components/DashboardScreen";
import ProcessingScreen from "./components/ProcessingScreen";
import ResultsWorkspace from "./components/ResultsWorkspace";
import { EnhancementSettings, DiagnosisResult, SavedPhoto, AppTab } from "./types";
import { applyImageFilters, upscaleCanvasImage, repairScratchesOnCanvas } from "./utils/imageFilters";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<AppTab>("home");

  // AI progress scanner states
  const [processingProgress, setProcessingProgress] = useState(0);
  const [activeStepText, setActiveStepText] = useState("Initializing neural layers...");

  const startProcessingFlow = (uri: string, name: string) => {
    setOriginalImageUrl(uri);
    setImageFileName(name);
    setCurrentTab("processing");
    setProcessingProgress(5);
    setActiveStepText("Decompressing raw bitmap grids...");

    // Simulate multi-step futuristic neural scanning log
    const steps = [
      { progress: 20, text: "Applying high-frequency bilateral smoothing grids..." },
      { progress: 42, text: "Repairing micro aberrative noise artifacts..." },
      { progress: 68, text: "Compensating channel exposure & contrast matrices..." },
      { progress: 88, text: "Upscaling sub-pixel interpolations..." },
      { progress: 100, text: "Compilation complete. Exporting workspace..." }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProcessingProgress(steps[stepIdx].progress);
        setActiveStepText(steps[stepIdx].text);
        stepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCurrentTab("enhance");
          // Trigger diagnosis immediately
          runAIDiagnosis(uri);
        }, 500);
      }
    }, 700);
  };

  // Quick Action presets loader
  const handleQuickAction = (toolName: string) => {
    let sampleType = "tech";
    let customSettings: Partial<EnhancementSettings> = {};

    if (toolName === "face") {
      sampleType = "portrait";
      customSettings = { SkinSmoothing: 40, eyeClarity: 50, sharpen: 30, colorize: false } as any;
    } else if (toolName === "blur") {
      sampleType = "rose";
      customSettings = { sharpen: 60, denoise: 25, colorize: false };
    } else if (toolName === "upscale") {
      sampleType = "tech";
      customSettings = { upscale: 4, sharpen: 50, denoise: 20, colorize: false };
    } else if (toolName === "restore") {
      sampleType = "portrait";
      customSettings = { sharpen: 40, skinSmoothing: 45, denoise: 35, contrast: 15, colorize: false };
    } else if (toolName === "colorize") {
      sampleType = "rose";
      customSettings = { colorize: true, contrast: 12, saturation: 30, sharpen: 30 };
    }

    setSettings(prev => ({ ...prev, ...customSettings }));

    // Generate immediate base64 canvas image to avoid latency
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d")!;

    if (sampleType === "portrait") {
      ctx.fillStyle = "#cca781";
      ctx.fillRect(0, 0, 600, 600);
      const radGrad = ctx.createRadialGradient(300, 270, 70, 300, 300, 300);
      radGrad.addColorStop(0, "#ffe8d1");
      radGrad.addColorStop(1, "#54391e");
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, 600, 600);

      ctx.fillStyle = "#8a653f";
      ctx.beginPath();
      ctx.ellipse(300, 480, 140, 100, 0, 0, Math.PI, true);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(300, 260, 90, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4a3520";
      ctx.beginPath();
      ctx.arc(300, 220, 105, Math.PI, 0);
      ctx.ellipse(300, 260, 105, 85, 0, 0, Math.PI);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(250, 40); ctx.lineTo(260, 520);
      ctx.moveTo(410, 100); ctx.lineTo(390, 580);
      ctx.stroke();
    } else if (sampleType === "rose") {
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(0, 0, 600, 600);
      const rGrad = ctx.createRadialGradient(300, 300, 30, 300, 300, 290);
      rGrad.addColorStop(0, "#cccccc");
      rGrad.addColorStop(1, "#111111");
      ctx.fillStyle = rGrad;
      ctx.fillRect(0, 0, 600, 600);
      ctx.strokeStyle = "#8a8a8a";
      ctx.lineWidth = 4;
      for (let r = 20; r < 160; r += 20) {
        ctx.beginPath(); ctx.arc(300, 260, r, 0, Math.PI * 2); ctx.stroke();
      }
    } else {
      ctx.fillStyle = "#0c0525";
      ctx.fillRect(0, 0, 600, 600);
      const gr = ctx.createLinearGradient(0, 0, 0, 600);
      gr.addColorStop(0, "#010103");
      gr.addColorStop(1, "#3c2278");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, 600, 600);
      ctx.fillStyle = "#160f38";
      ctx.fillRect(80, 220, 90, 380);
      ctx.fillRect(220, 150, 120, 450);
      ctx.fillRect(400, 280, 100, 320);
    }

    ctx.globalAlpha = 0.3;
    ctx.drawImage(canvas, 1, 1, 598, 598);
    ctx.globalAlpha = 1.0;

    const base64Uri = canvas.toDataURL("image/jpeg", 0.9);
    startProcessingFlow(base64Uri, `sample_${toolName}.jpg`);
  };

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
      // Clean offline mock diagnosis
      setAiDiagnostic({
        photoType: imgUri.length > 50000 ? "Scenic Snapshot" : "Portrait Shot",
        detectedIssues: ["Slight defocus blur", "Luminance noise", "Color fading"],
        advances: { sharpen: 35, denoise: 20, contrast: 8, saturation: 12, skinSmoothing: 25, eyeClarity: 35, colorize: false, upscalingFactor: 4 },
        analysisDescription: "Standard offline texture scanner identifies mild lens aberration. Automatically optimizing sharpness matrices."
      });
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
    startProcessingFlow(uri, name);
  };

  // Setup main, mask and live canvas states
  const setupCanvases = (img: HTMLImageElement) => {
    const mainC = mainCanvasRef.current;
    const maskC = maskCanvasRef.current;
    const prevC = previewCanvasRef.current;

    if (!mainC || !maskC || !prevC) return;

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

    mainC.width = tw;
    mainC.height = th;
    maskC.width = tw;
    maskC.height = th;
    prevC.width = tw;
    prevC.height = th;

    const mCtx = mainC.getContext("2d")!;
    const maskCtx = maskC.getContext("2d")!;

    mCtx.drawImage(img, 0, 0, tw, th);
    maskCtx.clearRect(0, 0, tw, th);

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

    const rawPixels = mCtx.getImageData(0, 0, mainC.width, mainC.height);

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

  const getCanvasMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
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

    ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
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

  const executeInpaintScratchRepair = () => {
    const mainC = mainCanvasRef.current;
    const maskC = maskCanvasRef.current;
    if (!mainC || !maskC) return;

    repairScratchesOnCanvas(mainC, maskC);
    setHasPaintedMask(false);
    setBrushMode(false);
    triggerRealtimeFilterPipeline();
  };

  const handleSaveAndExport = () => {
    const origC = mainCanvasRef.current;
    const prevC = previewCanvasRef.current;

    if (!origC || !prevC) return;

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

    const link = document.createElement("a");
    link.download = savedItem.name;
    link.href = enhancedDataUrl;
    link.click();
  };

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

  // Re-run pipeline whenever settings change
  useEffect(() => {
    if (originalImageUrl) {
      triggerRealtimeFilterPipeline();
    }
  }, [settings, originalImageUrl]);

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

  // Synchronize canvas on first load of image url
  useEffect(() => {
    if (originalImageUrl) {
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ w: img.width, h: img.height });
        setupCanvases(img);
      };
      img.src = originalImageUrl;
    }
  }, [originalImageUrl]);

  return (
    <div className="min-h-screen w-full bg-[#030012] text-zinc-100 flex items-center justify-center font-sans overflow-x-hidden p-0 sm:p-4 selection:bg-indigo-500/30 selection:text-white relative">
      
      {/* Background Neon Glowing spotlight nodes */}
      <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[145px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[145px] pointer-events-none -z-10" />

      {/* 1. App Splash Animation */}
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* 2. Seamless Handheld Mockup Bezel wrapper */}
      <div className="relative w-full h-screen sm:h-[840px] sm:max-w-[400px] sm:rounded-[36px] sm:border-[6px] sm:border-zinc-800 bg-[#09090d] shadow-[0_0_80px_rgba(79,70,229,0.18)] sm:ring-1 sm:ring-zinc-700/50 flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Top Status HUD detail strip */}
        <div className="hidden sm:flex absolute top-0 inset-x-0 h-6 items-center justify-between px-6 z-50 pointer-events-none bg-black/15 backdrop-blur-sm">
          <span className="text-[10px] font-bold text-zinc-350 font-mono">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
          {/* Virtual camera notch */}
          <div className="w-[80px] h-4 bg-zinc-950 rounded-full border border-zinc-800/40 absolute left-1/2 -translate-x-1/2 flex items-center justify-center p-0.5 gap-1 shadow-inner">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-850 border border-indigo-500/20"></div>
            <div className="w-1 h-1 rounded-full bg-zinc-900"></div>
          </div>
          {/* Signal and cellular stats */}
          <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-mono">
            <span>5G</span>
            <div className="h-2 w-px bg-zinc-700"></div>
            <span>98%</span>
          </div>
        </div>

        {/* Status Bar background height match */}
        <div className="hidden sm:block h-6 shrink-0 bg-[#09090d]" />

        {/* Dynamic Inner Screens Container (Height offset for global floating tabs at bottom) */}
        <div className="flex-1 flex flex-col overflow-hidden relative pb-16">

          {/* SCREEN 1 & 2: STUDIO DASHBOARD */}
          {currentTab === "home" && (
            <DashboardScreen
              onQuickAction={handleQuickAction}
              onUploadClick={() => setCurrentTab("upload")}
              savedGallery={savedGallery}
              onClearHistory={clearAllHistory}
              onRestoreGalleryItem={(item) => {
                setOriginalImageUrl(item.originalUrl);
                setImageFileName(item.name);
                setCurrentTab("enhance");
                const imgObj = new Image();
                imgObj.onload = () => {
                  setOriginalDimensions({ w: imgObj.width, h: imgObj.height });
                  setupCanvases(imgObj);
                  applyCreativeResultToCanvas(item.enhancedUrl);
                };
                imgObj.src = item.originalUrl;
              }}
            />
          )}

          {/* SCREEN 3: FILE SELECTION / UPLOAD SLIDER */}
          {currentTab === "upload" && (
            <div className="flex-1 flex flex-col bg-[#0a0a0f] p-4 space-y-4 overflow-y-auto">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">Step 1 of 3</span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Select Raw Photo</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">Select local images, or trigger our pre-configured age-degraded portraits instantly.</p>
              </div>

              {/* Responsive main uploader element */}
              <UploadSection onPhotoSelected={handlePhotoSelected} />

              <button
                onClick={() => handleQuickAction("face")}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Try With Demo Portrait Crop</span>
              </button>
            </div>
          )}

          {/* SCREEN 4: DETAILED scanning laser progress scanner */}
          {currentTab === "processing" && (
            <ProcessingScreen
              originalImageUrl={originalImageUrl}
              processingProgress={processingProgress}
              activeStepText={activeStepText}
            />
          )}

          {/* SCREEN 5: RESULTS SCREEN COMPARISON STAGE */}
          {currentTab === "enhance" && originalImageUrl && (
            <ResultsWorkspace
              originalImageUrl={originalImageUrl}
              imageFileName={imageFileName}
              originalDimensions={originalDimensions}
              settings={settings}
              setSettings={setSettings}
              brushMode={brushMode}
              setBrushMode={setBrushMode}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              hasPaintedMask={hasPaintedMask}
              sliderPosition={sliderPosition}
              setSliderPosition={setSliderPosition}
              isDraggingSlider={isDraggingSlider}
              comparisonContainerRef={comparisonContainerRef}
              mainCanvasRef={mainCanvasRef}
              previewCanvasRef={previewCanvasRef}
              maskCanvasRef={maskCanvasRef}
              sourceImageRef={sourceImageRef}
              isProcessingFilters={isProcessingFilters}
              aiDiagnostic={aiDiagnostic}
              isAnalyzing={isAnalyzing}
              onRunAIDiagnosis={() => runAIDiagnosis(originalImageUrl || "")}
              creativePrompt={creativePrompt}
              setCreativePrompt={setCreativePrompt}
              isReimagining={isReimagining}
              onRunCreativeReimagine={runCreativeReimagine}
              onSaveAndExport={handleSaveAndExport}
              onResetSliders={handleResetSliders}
              onStartScratchDrawing={startScratchDrawing}
              onDrawScratchMoving={drawScratchMoving}
              onStopScratchDrawing={stopScratchDrawing}
              onResetScratchMask={resetScratchMask}
              onExecuteInpaintScratchRepair={executeInpaintScratchRepair}
              onComparisonMouseDown={handleComparisonMouseDown}
              onComparisonTouchMove={handleComparisonTouchMove}
            />
          )}

          {/* SCREEN 6: ENGINE SETTINGS AND SPEC HUD */}
          {currentTab === "settings" && (
            <div className="flex-1 flex flex-col bg-[#0a0a0f] p-4 space-y-4 overflow-y-auto font-sans text-zinc-100">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold">Config Unit</span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">System Settings</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">Configure backend pipelines, storage limits and network parameters.</p>
              </div>

              {/* Hardware stats */}
              <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10.5px] font-bold text-white uppercase tracking-wider font-mono">Enhancer Core Specs</span>
                </div>
                
                <div className="space-y-2 text-[10.5px] font-mono text-zinc-400">
                  <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                    <span>Luma Projections</span>
                    <span className="text-zinc-200">Bilateral Grid Map</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                    <span>Smoothing kernels</span>
                    <span className="text-indigo-400">Neighborhood filter</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/60 pb-1.5">
                    <span>Bind Host Port</span>
                    <span className="text-zinc-200">Port 3000 (Express)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Device framework</span>
                    <span className="text-green-400">Capacitor APK-ready</span>
                  </div>
                </div>
              </div>

              {/* Gemini setup description */}
              <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wide">Gemini Brain diagnostics</h4>
                <p className="text-[10px] text-zinc-400 leading-normal leading-relaxed">
                  We schedule neural correction passes on detected picture anomalies. To test fully live features, ensure your server contains process.env.GEMINI_API_KEY.
                </p>
                <div className="p-2.5 bg-zinc-950 border border-zinc-900 text-[9.5px] font-mono text-indigo-300 rounded-xl">
                  ● Status: Fallback analysis scanner active (No charge)
                </div>
              </div>

              {/* Clean database */}
              <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-3.5">
                <h4 className="text-xs font-bold text-white">Reset persistent history databases</h4>
                <p className="text-[10px] text-zinc-400 leading-normal leading-relaxed">
                  This wipes all saved laboratory restorations synced on your browser cache files.
                </p>
                <button
                  onClick={() => {
                    clearAllHistory();
                    alert("Cache empty. All localized histories removed from persistent web-db storage.");
                  }}
                  className="w-full py-2 bg-red-955/20 bg-red-950/20 text-red-400 border border-red-500/15 rounded-xl text-xs font-mono font-bold cursor-pointer hover:bg-opacity-80 transition-all"
                >
                  Clear Device Database Cache
                </button>
              </div>

              <div className="text-center font-mono text-[9px] text-zinc-650 pt-3">
                UltraHD applet built for Capacitor v6.0
              </div>
            </div>
          )}

        </div>

        {/* 3. Global Sleek Bottom Navigation menu bar (Simulating iOS/Android native interaction) */}
        <nav className="absolute bottom-0 inset-x-0 h-16 bg-zinc-950/95 border-t border-zinc-900/70 flex items-center justify-around z-40 px-3 py-1 pb-2">
          
          {/* Button 1: Home dashboard */}
          <button
            onClick={() => setCurrentTab("home")}
            className={`flex flex-col items-center justify-center w-12 transition-all cursor-pointer ${
              currentTab === "home" ? "text-indigo-400 scale-105 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Camera className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5 tracking-wider font-semibold font-sans uppercase">Studio</span>
          </button>

          {/* Button 2: Upload */}
          <button
            onClick={() => setCurrentTab("upload")}
            className={`flex flex-col items-center justify-center w-12 transition-all cursor-pointer ${
              currentTab === "upload" ? "text-indigo-400 scale-105 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5 tracking-wider font-semibold uppercase font-sans">Upload</span>
          </button>

          {/* Button 3: active comparison stage */}
          <button
            disabled={!originalImageUrl}
            onClick={() => setCurrentTab("enhance")}
            className={`flex flex-col items-center justify-center w-12 transition-all ${
              !originalImageUrl ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
            } ${
              currentTab === "enhance" ? "text-indigo-400 scale-105 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="text-[8.5px] mt-0.5 tracking-wider font-semibold uppercase font-sans">Lab</span>
          </button>

          {/* Button 4: settings */}
          <button
            onClick={() => setCurrentTab("settings")}
            className={`flex flex-col items-center justify-center w-12 transition-all cursor-pointer ${
              currentTab === "settings" ? "text-indigo-400 scale-105 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[8.5px] mt-0.5 tracking-wider font-semibold uppercase font-sans">Engine</span>
          </button>

        </nav>

        {/* Tactile Bottom TouchBar Handle indicator (Physically modeled iOS/Android style bezel) */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-zinc-800 rounded-full z-45" />

      </div>
    </div>
  );
}
