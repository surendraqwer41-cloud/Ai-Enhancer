import React, { useEffect, useState } from "react";
import { Sparkles, Camera, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [percent, setPercent] = useState(0);
  const [currentTask, setCurrentTask] = useState("Initializing neural channels...");

  const tasks = [
    "Initializing neural channels...",
    "Calibrating facial vertex models...",
    "Loading bilinear GPU scaler...",
    "Syncing Gemini Ultra-HD core...",
    "Ready to optimize."
  ];

  useEffect(() => {
    // Increment loading percent progressively
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        // Update task phrase dynamically as percentage climbs
        const taskIdx = Math.min(
          tasks.length - 1,
          Math.floor((prev / 100) * tasks.length)
        );
        setCurrentTask(tasks[taskIdx]);
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (percent === 100) {
      const timer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [percent, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-white p-6 select-none overflow-hidden">
      {/* Abstract Background Glows */}
      <div className="absolute top-[20%] left-[10%] w-72 h-72 rounded-full bg-purple-600/10 blur-[120px]" />
      <div className="absolute bottom-[20%] right-[10%] w-72 h-72 rounded-full bg-blue-600/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center max-w-md w-full relative z-10"
      >
        {/* Core Animated App Icon */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-indigo-600 blur-lg opacity-60 scale-110"
          ></motion.div>
          
          <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl p-4">
            <Camera className="w-10 h-10 text-purple-400 absolute" />
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-1 rounded-md shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            </motion.div>
            <Cpu className="w-4 h-4 text-blue-400 absolute bottom-3 right-3" />
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-250 via-indigo-300 to-purple-400">
          UltraHD AI
        </h1>
        <p className="mt-2 text-xs text-indigo-400 font-bold tracking-widest uppercase">
          Neural Resolution & Enhancement Suite
        </p>

        {/* Loading Bar and Stats */}
        <div className="mt-12 w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex justify-between items-center text-xs text-slate-405 font-mono mb-2">
            <span className="text-purple-400 animate-pulse">{currentTask}</span>
            <span className="font-bold text-white">{percent}%</span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400"
              initial={{ width: "0%" }}
              animate={{ width: `${percent}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="mt-16 text-[10px] text-slate-500 tracking-widest font-mono">
          STEREOSCOPIC PIXEL RECONSTRUCTION // v2.5.0
        </div>
      </motion.div>
    </div>
  );
}
