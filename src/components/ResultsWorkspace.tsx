import React, { useState } from "react";
import { Sliders, Paintbrush, Download, Cpu, Sparkles, Scale, Settings as SettingsIcon } from "lucide-react";
import { EnhancementSettings, DiagnosisResult } from "../types";

interface ResultsWorkspaceProps {
  originalImageUrl: string;
  imageFileName: string;
  originalDimensions: { w: number; h: number } | null;
  settings: EnhancementSettings;
  setSettings: React.Dispatch<React.SetStateAction<EnhancementSettings>>;
  
  // Brush & healing states
  brushMode: boolean;
  setBrushMode: (b: boolean) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  hasPaintedMask: boolean;

  // Comparison layout states
  sliderPosition: number;
  setSliderPosition: (pos: number) => void;
  isDraggingSlider: React.MutableRefObject<boolean>;
  comparisonContainerRef: React.RefObject<HTMLDivElement | null>;
  mainCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  previewCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  sourceImageRef: React.RefObject<HTMLImageElement | null>;
  
  // Pipeline status
  isProcessingFilters: boolean;

  // Diagnostic states
  aiDiagnostic: DiagnosisResult | null;
  isAnalyzing: boolean;
  onRunAIDiagnosis: () => void;

  // Reimaginator prompt states
  creativePrompt: string;
  setCreativePrompt: (p: string) => void;
  isReimagining: boolean;
  onRunCreativeReimagine: () => void;

  // Global action handlers
  onSaveAndExport: () => void;
  onResetSliders: () => void;
  onStartScratchDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onDrawScratchMoving: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onStopScratchDrawing: () => void;
  onResetScratchMask: () => void;
  onExecuteInpaintScratchRepair: () => void;
  onComparisonMouseDown: () => void;
  onComparisonTouchMove: (e: React.TouchEvent) => void;
}

export default function ResultsWorkspace({
  originalImageUrl,
  imageFileName,
  originalDimensions,
  settings,
  setSettings,
  brushMode,
  setBrushMode,
  brushSize,
  setBrushSize,
  hasPaintedMask,
  sliderPosition,
  setSliderPosition,
  isDraggingSlider,
  comparisonContainerRef,
  mainCanvasRef,
  previewCanvasRef,
  maskCanvasRef,
  sourceImageRef,
  isProcessingFilters,
  aiDiagnostic,
  isAnalyzing,
  onRunAIDiagnosis,
  creativePrompt,
  setCreativePrompt,
  isReimagining,
  onRunCreativeReimagine,
  onSaveAndExport,
  onResetSliders,
  onStartScratchDrawing,
  onDrawScratchMoving,
  onStopScratchDrawing,
  onResetScratchMask,
  onExecuteInpaintScratchRepair,
  onComparisonMouseDown,
  onComparisonTouchMove
}: ResultsWorkspaceProps) {
  
  // Categorize sliders into groups to save valuable vertical screen real estate
  const [activeTab, setActiveTab] = useState<"base" | "face" | "tone" | "info">("base");

  // Mouse move handler for comparative slider track
  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (brushMode || !isDraggingSlider.current || !comparisonContainerRef.current) return;
    const rect = comparisonContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    setSliderPosition(percentage);
  };

  return (
    <div id="results_workspace" className="flex-1 flex flex-col bg-[#07070a] overflow-hidden select-none">
      
      {/* 1. Comparison Stage Canvas Viewport */}
      <div className="relative flex-1 bg-[#040406] flex items-center justify-center p-3 overflow-hidden border-b border-zinc-900 shadow-inner">
        
        {/* Aspect Ratio bounding box wrapper */}
        <div
          ref={comparisonContainerRef}
          className="relative max-w-full max-h-full aspect-auto overflow-hidden rounded-2xl border border-zinc-800/70 shadow-2xl flex items-center justify-center bg-zinc-950"
          style={{
            width: previewCanvasRef.current ? `${previewCanvasRef.current.width}px` : "100%",
            height: previewCanvasRef.current ? `${previewCanvasRef.current.height}px` : "240px",
            cursor: isDraggingSlider.current ? "ew-resize" : "default"
          }}
          onMouseMove={handleStageMouseMove}
          onTouchMove={onComparisonTouchMove}
        >
          {/* Base Original (Before) */}
          <div className="absolute inset-0 w-full h-full">
            <canvas
              ref={mainCanvasRef}
              className="w-full h-full object-contain pointer-events-none block blur-[0.5px]"
            />
            <div className="absolute bottom-2.5 left-2.5 bg-black/75 border border-zinc-850 px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest text-zinc-400 z-20">
              Before
            </div>
          </div>

          {/* Slit Clip Enhanced output (After) */}
          <div
            className="absolute inset-y-0 right-0 h-full overflow-hidden border-l border-indigo-400 z-10"
            style={{ left: `${sliderPosition}%` }}
          >
            <div
              className="absolute inset-y-0 h-full select-none pointer-events-none"
              style={{
                width: previewCanvasRef.current ? `${previewCanvasRef.current.width}px` : "100%",
                left: `-${sliderPosition}%`
              }}
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain pointer-events-none block"
              />
            </div>
            <div className="absolute bottom-2.5 right-2.5 bg-indigo-950/80 border border-indigo-500/30 px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest text-indigo-300 z-20 whitespace-nowrap">
              After AI
            </div>
          </div>

          {/* Invisible background image reference fetcher */}
          <img
            ref={sourceImageRef}
            src={originalImageUrl}
            className="hidden"
            alt="Source hidden loading"
            referrerPolicy="no-referrer"
          />

          {/* Floating Painted Scratch mask brush drawing overlay */}
          <canvas
            ref={maskCanvasRef}
            onMouseDown={onStartScratchDrawing}
            onMouseMove={onDrawScratchMoving}
            onMouseUp={onStopScratchDrawing}
            onMouseLeave={onStopScratchDrawing}
            className={`absolute inset-0 w-full h-full z-30 transition-opacity duration-200 ${
              brushMode ? "block cursor-crosshair opacity-100" : "pointer-events-none opacity-0"
            }`}
          />

          {/* Comparative slider divider handle bar */}
          {!brushMode && (
            <div
              className="absolute top-0 bottom-0 w-0.5 z-30 cursor-ew-resize bg-indigo-400"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={(e) => {
                e.preventDefault();
                onComparisonMouseDown();
              }}
            >
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-6-line w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center shadow-xl border border-indigo-400 select-none hover:scale-105 active:scale-95 transition-transform">
                <Scale className="w-3.5 h-3.5 text-indigo-300" />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 2. Adjustment details and controls bottom drawer */}
      <div className="h-[296px] shrink-0 border-t border-zinc-900/90 bg-[#07070a] p-3 flex flex-col justify-between">
        
        {/* Controls Toolbar Segment bar */}
        <div className="flex items-center justify-between pb-1 shrink-0">
          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-900 shrink-0">
            <button
              onClick={() => setActiveTab("base")}
              className={`px-2 py-1 text-[9.5px] font-mono uppercase font-bold rounded-md transition-all ${
                activeTab === "base" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              Base
            </button>
            <button
              onClick={() => setActiveTab("face")}
              className={`px-2 py-1 text-[9.5px] font-mono uppercase font-bold rounded-md transition-all ${
                activeTab === "face" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              Face
            </button>
            <button
              onClick={() => setActiveTab("tone")}
              className={`px-2 py-1 text-[9.5px] font-mono uppercase font-bold rounded-md transition-all ${
                activeTab === "tone" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              Tone
            </button>
            <button
              onClick={() => setActiveTab("info")}
              className={`px-2 py-1 text-[9.5px] font-mono uppercase font-bold rounded-md transition-all ${
                activeTab === "info" ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              Diagnose
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBrushMode(!brushMode)}
              className={`px-2 py-1 rounded-md text-[9px] font-extrabold font-mono flex items-center gap-1 border transition-all cursor-pointer ${
                brushMode
                  ? "bg-red-500/15 border-red-500/30 text-red-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
              }`}
            >
              <Paintbrush className="w-3 h-3" />
              <span>{brushMode ? "Exit Heal" : "Heal Scrapes"}</span>
            </button>
            {!brushMode && (
              <button
                onClick={onResetSliders}
                className="text-[9.5px] font-mono font-bold text-zinc-500 hover:text-white border border-zinc-900 p-1 px-1.5 rounded"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Categories sliding panel core container */}
        <div className="flex-1 overflow-y-auto py-1 px-0.5">

          {/* ACTIVE BRUSH OPTION */}
          {brushMode && (
            <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-red-400 font-extrabold uppercase">Scratch Inpaint Brush</span>
                <span className="text-zinc-300 font-bold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-red-500 h-1.5 bg-red-950/30 rounded cursor-pointer"
              />
              <p className="text-[9.5px] text-zinc-400 leading-normal">
                Carefully paint over dust spots or historical scratch lines. Tapping "Execute Heal" runs neighborhood color diffusion to dissolve the blemish.
              </p>
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={onResetScratchMask}
                  className="flex-1 py-1.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-450 text-[10px] font-bold rounded-lg cursor-pointer text-zinc-300"
                >
                  Clear Painted
                </button>
                <button
                  onClick={onExecuteInpaintScratchRepair}
                  disabled={!hasPaintedMask}
                  className={`flex-1 py-1.5 text-white text-[10px] font-extrabold rounded-lg ${
                    hasPaintedMask ? "bg-red-600 hover:bg-red-550 cursor-pointer" : "bg-zinc-850 text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  Execute Heal
                </button>
              </div>
            </div>
          )}

          {/* REGULAR TUNING SLIDERS */}
          {!brushMode && (
            <div className="space-y-3">
              
              {/* TAB A: BASE RESTORATION (Sharpen, Denoise, Upscaling Factor) */}
              {activeTab === "base" && (
                <div className="space-y-3 animate-fade-in">
                  {/* Sizing presets */}
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-widest block mb-1 font-mono">
                      Super-Resolution Upscaling:
                    </span>
                    <div className="grid grid-cols-3 gap-2 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-900">
                      {[2, 4, 8].map((fac) => (
                        <button
                          key={fac}
                          onClick={() => setSettings((p) => ({ ...p, upscale: fac as 2 | 4 | 8 }))}
                          className={`py-1 text-[10px] font-mono font-black rounded-md transition-all ${
                            settings.upscale === fac
                              ? "bg-indigo-600 text-white shadow"
                              : "text-zinc-500 hover:text-zinc-200"
                          }`}
                        >
                          {fac}x HD
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sharpen detail */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-300">Sharpen Details factor</span>
                      <span className="text-indigo-400 font-bold">{settings.sharpen}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.sharpen}
                      onChange={(e) => setSettings((p) => ({ ...p, sharpen: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Denoise noise */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-300">Bilateral Denoise (Smooth noise)</span>
                      <span className="text-indigo-400 font-bold">{settings.denoise}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.denoise}
                      onChange={(e) => setSettings((p) => ({ ...p, denoise: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* TAB B: PORTRAIT FACIAL ENHANCEMENT */}
              {activeTab === "face" && (
                <div className="space-y-3.5 animate-fade-in">
                  
                  {/* Skin smoother */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-300">Skin smoothing / blemish core</span>
                      <span className="text-indigo-400 font-bold">{settings.skinSmoothing}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.skinSmoothing}
                      onChange={(e) => setSettings((p) => ({ ...p, skinSmoothing: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Eye Clarity */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-300">Eye highlight / Iris clarity</span>
                      <span className="text-indigo-400 font-bold">{settings.eyeClarity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.eyeClarity}
                      onChange={(e) => setSettings((p) => ({ ...p, eyeClarity: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>

                  <p className="text-[9.5px] text-indigo-400 font-mono italic leading-normal">
                    AI Portrait features smooth blemishes and enhance key iris sharpness parameters automatically on portrait crops.
                  </p>
                </div>
              )}

              {/* TAB C: TONE MATRIX CONFIGURATIONS */}
              {activeTab === "tone" && (
                <div className="space-y-3 animate-fade-in">
                  
                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-300">Contrast Boost factors</span>
                      <span className="text-indigo-400 font-bold">{settings.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.contrast}
                      onChange={(e) => setSettings((p) => ({ ...p, contrast: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-300">Saturation vividness multiplier</span>
                      <span className="text-indigo-400 font-bold">{settings.saturation}%</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.saturation}
                      onChange={(e) => setSettings((p) => ({ ...p, saturation: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-zinc-900 accent-indigo-500 rounded cursor-pointer"
                    />
                  </div>

                  {/* Mono colorize toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-900 mt-1">
                    <span className="text-[10.5px] text-zinc-300 font-extrabold font-mono">AI B&W Colorizer</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.colorize}
                        onChange={(e) => setSettings((p) => ({ ...p, colorize: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2.5px] after:left-[2.5px] after:bg-zinc-400 after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-650 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB D: CORE AI DIAGNOSTIC STATUS */}
              {activeTab === "info" && (
                <div className="space-y-2.5 animate-fade-in text-zinc-300 text-[11px] font-mono">
                  
                  {isAnalyzing ? (
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900/60 text-center space-y-2">
                      <div className="w-5 h-5 border-2 border-indigo-500/25 border-t-indigo-400 rounded-full animate-spin mx-auto"></div>
                      <p className="text-[10px] text-zinc-400 font-bold animate-pulse">Running Neural scan...</p>
                    </div>
                  ) : aiDiagnostic ? (
                    <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-indigo-455 text-indigo-400">Identified Model</span>
                        <p className="text-xs text-white font-extrabold">{aiDiagnostic.photoType}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Detected Issues</span>
                        <p className="text-[10px] text-zinc-300 leading-normal">{aiDiagnostic.detectedIssues?.join(", ") || "None found"}</p>
                      </div>
                      <p className="text-[9.5px] text-zinc-500 leading-snug border-t border-zinc-900/70 pt-1.5 italic">
                        "{aiDiagnostic.analysisDescription}"
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-950 border border-zinc-900/60 rounded-xl text-center space-y-2">
                      <p className="text-[10px] text-zinc-400">Offline diagnostic scanner ready for local review analysis.</p>
                      <button
                        onClick={onRunAIDiagnosis}
                        className="py-1 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Launch Diagnostic Scan
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Global HD Save trigger button on bottom block */}
        <div className="pt-2 border-t border-zinc-900/40 shrink-0">
          <button
            onClick={onSaveAndExport}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-555 hover:to-teal-555 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 text-white cursor-pointer shadow-lg shadow-emerald-950/15"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download HD Enhanced Image</span>
          </button>
          
          <div className="flex justify-between items-center text-[8.5px] text-zinc-550 text-zinc-500 font-mono mt-2 px-1">
            <span>UNITS: {originalDimensions ? `${originalDimensions.w * settings.upscale} x ${originalDimensions.h * settings.upscale} PX` : "CALCULATING..."}</span>
            <span>FORMAT: JPEG HIGH-DENSITY (90%)</span>
          </div>
        </div>

      </div>

    </div>
  );
}
