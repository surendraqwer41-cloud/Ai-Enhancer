import React from "react";
import { motion } from "motion/react";

interface ProcessingScreenProps {
  originalImageUrl: string | null;
  processingProgress: number;
  activeStepText: string;
}

export default function ProcessingScreen({
  originalImageUrl,
  processingProgress,
  activeStepText
}: ProcessingScreenProps) {
  return (
    <div id="processing_screen" className="flex-1 flex flex-col items-center justify-center bg-[#07070c] p-6 text-center select-none text-white">
      
      {/* Scanning Stage Ring */}
      <div className="relative w-44 h-44 rounded-full bg-zinc-950 border border-indigo-500/20 flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(79,70,229,0.12)] mb-8">
        
        {originalImageUrl && (
          <img
            src={originalImageUrl}
            className="absolute inset-0 w-full h-full object-cover opacity-30 filter blur-[0.5px]"
            alt="Scanning source"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Sweeping neon laser bar */}
        <motion.div
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_15px_rgba(79,70,229,0.9)] z-20"
        />

        {/* Outer glowing dynamic SVG circle percentage indicator */}
        <svg className="w-full h-full transform -rotate-90 absolute inset-0 z-10 pointer-events-none p-1.5" viewBox="0 0 100 100">
          <circle
            className="text-zinc-900"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
          <circle
            className="text-indigo-500 transition-all duration-300"
            strokeWidth="3.5"
            strokeDasharray="276"
            strokeDashoffset={276 - (276 * processingProgress) / 100}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        <div className="relative z-20 text-center">
          <span className="text-3xl font-black tracking-tighter font-mono text-white">
            {processingProgress}%
          </span>
          <p className="text-[8px] text-indigo-300 tracking-widest font-mono uppercase mt-0.5">npu array</p>
        </div>
      </div>

      {/* Interactive Neural steps logging */}
      <div className="space-y-2 max-w-xs">
        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-widest font-bold">
          Enhancing Core Pixels
        </span>
        <h3 className="text-lg font-black tracking-tight mt-1 px-1 font-sans text-white">
          Transforming Grids
        </h3>
        <p className="text-xs text-zinc-400 font-mono leading-normal h-10 px-2 animate-pulse">
          {activeStepText}
        </p>
      </div>

      {/* Progress Bar indicator */}
      <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-full h-2 overflow-hidden mt-6 shadow-inner relative">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400 transition-all duration-300 rounded-full"
          style={{ width: `${processingProgress}%` }}
        />
      </div>

      <span className="text-[9px] text-zinc-650 text-zinc-500 font-mono tracking-widest mt-10">
        SYSTEM THREAD ACTIVE // ULTRAHD ENGINE v2.5
      </span>

    </div>
  );
}
