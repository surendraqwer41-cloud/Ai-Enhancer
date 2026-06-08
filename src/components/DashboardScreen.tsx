import React from "react";
import { Camera, Sliders, Layers, Sparkles, Upload, ChevronRight, Cpu } from "lucide-react";
import { SavedPhoto } from "../types";

interface DashboardScreenProps {
  onQuickAction: (tool: string) => void;
  onUploadClick: () => void;
  savedGallery: SavedPhoto[];
  onRestoreGalleryItem: (item: SavedPhoto) => void;
  onClearHistory: () => void;
}

export default function DashboardScreen({
  onQuickAction,
  onUploadClick,
  savedGallery,
  onRestoreGalleryItem,
  onClearHistory
}: DashboardScreenProps) {
  // Simple greeting based on active local hours
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning, Creator";
    if (hr < 18) return "Good afternoon, Creator";
    return "Good evening, Creator";
  };

  return (
    <div id="dashboard_screen" className="flex-1 flex flex-col overflow-y-auto bg-[#0a0a0f] p-4 space-y-5 select-none">
      
      {/* Premium Header branding */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase">
            UltraHD Neural Eng v2.5
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            {getGreeting()}
          </h2>
        </div>
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-4.5 h-4.5 animate-pulse" />
        </div>
      </div>

      {/* GPU Performance Specs HUD */}
      <div id="performance_hud" className="grid grid-cols-3 gap-2 bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/40 backdrop-blur-md">
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 font-mono tracking-wide">CORE STATUS</p>
          <p className="text-xs font-black text-emerald-400 mt-0.5 uppercase">STABLE</p>
        </div>
        <div className="text-center border-x border-zinc-805/40 border-zinc-800/40">
          <p className="text-[10px] text-zinc-500 font-mono tracking-wide">NPU THREADS</p>
          <p className="text-xs font-black text-indigo-400 mt-0.5">HIGH-RES</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-zinc-500 font-mono tracking-wide">FPS LATENCY</p>
          <p className="text-xs font-black text-purple-400 mt-0.5">~2.5 Sec</p>
        </div>
      </div>

      {/* Upload Call-to-action button */}
      <button
        id="dash_upload_btn"
        onClick={onUploadClick}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-550 hover:to-purple-550 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/10 cursor-pointer text-white hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        <Upload className="w-4 h-4 text-white" />
        <span>Load Faded Canvas Photo</span>
      </button>

      {/* Automated Core Quick AI Presets */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono px-1">
          Neural One-Click Restoration
        </h3>
        <div className="grid grid-cols-2 gap-3">
          
          {/* Preset A: Portrait Enhancement */}
          <div
            onClick={() => onQuickAction("face")}
            className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col gap-2 group hover:bg-zinc-900/50"
          >
            <div className="w-7 h-7 bg-indigo-500/15 border border-indigo-500/25 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI Face Enhancer</p>
              <p className="text-[9.5px] text-zinc-400 mt-0.5 leading-normal">Recover smooth facial tones & deep eye features.</p>
            </div>
          </div>

          {/* Preset B: Defog / Blur Removal */}
          <div
            onClick={() => onQuickAction("blur")}
            className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col gap-2 group hover:bg-zinc-900/50"
          >
            <div className="w-7 h-7 bg-purple-500/15 border border-purple-500/25 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">AI Blur Removal</p>
              <p className="text-[9.5px] text-zinc-400 mt-0.5 leading-normal">Deep unsharp masking & aberration reduction.</p>
            </div>
          </div>

          {/* Preset C: 8x Superres Up-scale */}
          <div
            onClick={() => onQuickAction("upscale")}
            className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col gap-2 group hover:bg-zinc-900/50"
          >
            <div className="w-7 h-7 bg-teal-500/15 border border-teal-500/25 rounded-xl flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Direct 8x Upscaler</p>
              <p className="text-[9.5px] text-zinc-400 mt-0.5 leading-normal">Bicubic high-pass pixels interpolation.</p>
            </div>
          </div>

          {/* Preset D: Age Degradation Restore */}
          <div
            onClick={() => onQuickAction("restore")}
            className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:border-indigo-500/40 cursor-pointer transition-all flex flex-col gap-2 group hover:bg-zinc-900/50"
          >
            <div className="w-7 h-7 bg-yellow-500/15 border border-yellow-500/25 rounded-xl flex items-center justify-center text-yellow-500 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Old Photo Restore</p>
              <p className="text-[9.5px] text-zinc-400 mt-0.5 leading-normal">Neutralize aging scratches and dirt layers.</p>
            </div>
          </div>

        </div>
      </div>

      {/* History log roll section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
            Recent Lab Work
          </h3>
          {savedGallery.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[9px] text-red-400 hover:underline font-mono"
            >
              Clear All
            </button>
          )}
        </div>

        {savedGallery.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-zinc-800/80 bg-zinc-950/20 rounded-2xl text-zinc-500 text-[11px] leading-relaxed select-none">
            Your laboratory archive is currently empty. Upload images or select one-click presets above to populate your collection.
          </div>
        ) : (
          <div className="space-y-2 pr-0.5 max-h-[220px] overflow-y-auto">
            {savedGallery.slice(0, 10).map((photo) => (
              <div
                key={photo.id}
                onClick={() => onRestoreGalleryItem(photo)}
                className="p-2.5 bg-zinc-900/40 border border-zinc-800/40 hover:border-zinc-700/60 transition-colors rounded-xl flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-zinc-800/50 shrink-0">
                  <img src={photo.enhancedUrl} className="w-full h-full object-cover" alt="Thumb" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{photo.name}</p>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                    {new Date(photo.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
