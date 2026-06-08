import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface UploadSectionProps {
  onPhotoSelected: (imageUri: string, fileName: string) => void;
}

export default function UploadSection({ onPhotoSelected }: UploadSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  // File Change Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Convert uploaded file to base64
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onPhotoSelected(reader.result, file.name || "uploaded_photo.jpg");
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Dynamically generate vintage sample images on a canvas
  // This is a brilliant 0-asset solution to give the user immediate sample images!
  const generateSampleImage = (type: "portrait" | "skyline" | "rose") => {
    setLoadingSample(type);

    setTimeout(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d")!;

      if (type === "portrait") {
        // --- Vintage Sepia Portrait ---
        // Warm brown paper backing
        ctx.fillStyle = "#cca781";
        ctx.fillRect(0, 0, 600, 600);

        // Portrait vignette glow
        const radGrad = ctx.createRadialGradient(300, 270, 70, 300, 300, 300);
        radGrad.addColorStop(0, "#ffe8d1");
        radGrad.addColorStop(0.3, "#cca781");
        radGrad.addColorStop(1, "#54391e");
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, 600, 600);

        // Draw vintage silhouette details (head and body shoulders)
        ctx.fillStyle = "#8a653f";
        ctx.beginPath();
        ctx.ellipse(300, 480, 140, 100, 0, 0, Math.PI, true);
        ctx.fill();

        // Draw head
        ctx.beginPath();
        ctx.arc(300, 260, 90, 0, Math.PI * 2);
        ctx.fill();

        // Hair outline
        ctx.fillStyle = "#4a3520";
        ctx.beginPath();
        ctx.arc(300, 220, 100, Math.PI, 0);
        ctx.ellipse(300, 260, 100, 80, 0, 0, Math.PI);
        ctx.fill();

        // Eye shadows & lips (faded and blurry)
        ctx.fillStyle = "#5c4127";
        ctx.beginPath();
        ctx.arc(265, 260, 14, 0, Math.PI * 2);
        ctx.arc(335, 260, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#9c5740";
        ctx.beginPath();
        ctx.ellipse(300, 310, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw artificial photographic noise (dirt speckles)
        ctx.fillStyle = "#000000";
        for (let i = 0; i < 400; i++) {
          const x = Math.random() * 600;
          const y = Math.random() * 600;
          ctx.globalAlpha = Math.random() * 0.15;
          ctx.fillRect(x, y, 1.5, 1.5);
        }

        // Add prominent retro vertical scratches
        ctx.strokeStyle = "#ffe8d1";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(150, 0);
        ctx.lineTo(135, 600);
        ctx.moveTo(420, 0);
        ctx.lineTo(440, 600);
        ctx.stroke();

        ctx.strokeStyle = "#382716";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(280, 50);
        ctx.arcTo(290, 120, 295, 300, 600);
        ctx.stroke();

        // Apply global blur simulation (lens fuzziness)
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#caa580";
        ctx.filter = "blur(8px)";
        ctx.drawImage(canvas, 1, 1, 598, 598);
        ctx.filter = "none";
        ctx.globalAlpha = 1.0;

      } else if (type === "rose") {
        // --- Vintage Heritage Black-and-White Rose ---
        ctx.fillStyle = "#4a4a4a";
        ctx.fillRect(0, 0, 600, 600);

        // Lighting vignette
        const rGrad = ctx.createRadialGradient(300, 300, 30, 300, 300, 290);
        rGrad.addColorStop(0, "#c2c2c2");
        rGrad.addColorStop(0.5, "#4d4d4d");
        rGrad.addColorStop(1, "#141414");
        ctx.fillStyle = rGrad;
        ctx.fillRect(0, 0, 600, 600);

        // Dynamic concentric rose petals geometry
        ctx.strokeStyle = "#a1a1a1";
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.6;
        for (let r = 20; r < 180; r += 20) {
          ctx.beginPath();
          ctx.arc(300, 260, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Flower Stem
        ctx.strokeStyle = "#c2c2c2";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(300, 260);
        ctx.quadraticCurveTo(280, 400, 310, 560);
        ctx.stroke();

        // Leaves
        ctx.fillStyle = "#8a8a8a";
        ctx.beginPath();
        ctx.ellipse(260, 380, 45, 20, Math.PI/6, 0, Math.PI*2);
        ctx.ellipse(330, 435, 45, 20, -Math.PI/6, 0, Math.PI*2);
        ctx.fill();

        // Dust & heavy salt-and-pepper sensor noise
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 900; i++) {
          const x = Math.random() * 600;
          const y = Math.random() * 600;
          ctx.globalAlpha = Math.random() * 0.35;
          ctx.fillRect(x, y, 1.5, 1.5);
        }

        ctx.fillStyle = "#000000";
        for (let i = 0; i < 900; i++) {
          const x = Math.random() * 600;
          const y = Math.random() * 600;
          ctx.globalAlpha = Math.random() * 0.35;
          ctx.fillRect(x, y, 1.5, 1.5);
        }

        // Artificial chemical fade marks
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.arc(80, 120, 90, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1.0;

      } else {
        // --- Grainy Skyline ---
        // Deep purple night background
        ctx.fillStyle = "#110b29";
        ctx.fillRect(0, 0, 600, 600);

        // Sky glow
        const rGrad = ctx.createRadialGradient(300, 500, 50, 300, 400, 500);
        rGrad.addColorStop(0, "#ff4081");
        rGrad.addColorStop(0.4, "#3f51b5");
        rGrad.addColorStop(1, "#070414");
        ctx.fillStyle = rGrad;
        ctx.fillRect(0, 0, 600, 600);

        // Draw blurry low-res neon skyline buildings
        ctx.fillStyle = "#1e133d";
        ctx.fillRect(50, 250, 90, 350);
        ctx.fillRect(180, 180, 110, 420);
        ctx.fillRect(340, 290, 120, 310);
        ctx.fillRect(490, 210, 80, 390);

        // Blurry yellow windows
        ctx.fillStyle = "#ffe082";
        for (let row = 0; row < 10; row++) {
          ctx.fillRect(70, 270 + row * 25, 12, 12);
          ctx.fillRect(210, 200 + row * 25, 15, 15);
          ctx.fillRect(250, 200 + row * 25, 15, 15);
          ctx.fillRect(370, 310 + row * 25, 12, 12);
          ctx.fillRect(510, 240 + row * 25, 12, 12);
        }

        // Apply camera sensor lens noise and massive resolution bleed (chromatic blur)
        ctx.filter = "blur(11px)";
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.2;
        ctx.drawImage(canvas, -2, -2, 604, 604);
        ctx.filter = "none";
        
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 1500; i++) {
          const x = Math.random() * 600;
          const y = Math.random() * 600;
          ctx.globalAlpha = Math.random() * 0.45;
          ctx.fillRect(x, y, 2, 2);
        }
        ctx.globalAlpha = 1.0;
      }

      const base64Uri = canvas.toDataURL("image/jpeg", 0.85);
      const nameMap = {
        portrait: "sample_vintage_portrait.jpg",
        rose: "sample_sepia_flower.jpg",
        skyline: "sample_grainy_skyline.jpg"
      };

      onPhotoSelected(base64Uri, nameMap[type]);
      setLoadingSample(null);
    }, 500);
  };

  return (
    <div id="upload_view_container" className="max-w-4xl mx-auto px-4 py-8 relative">
      <div className="absolute inset-0 bg-radial from-purple-500/5 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Main Drag-Drop Workspace */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed p-10 md:p-16 text-center cursor-pointer transition-all duration-300 backdrop-blur-xl ${
          isDragOver
            ? "border-purple-400 bg-purple-500/10 shadow-3xl shadow-purple-500/10 scale-[1.01]"
            : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-purple-500/2"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          id="photo-file-picker"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Dynamic upload details */}
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl scale-125 animate-pulse" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-purple-400 group-hover:text-purple-300">
              <UploadCloud className="w-8 h-8" />
            </div>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Upload Your Degraded Photo
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            Drag and drop your image anywhere on the container, or <span className="text-purple-400 font-medium hover:underline">browse files</span>. Support format JPG, PNG, WEBP, HEIC.
          </p>

          <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-405">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
              Blur Removal
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-405">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Face Enhancement
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-405">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Scratch Repair
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-405">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
              B&W Colorize
            </span>
          </div>
        </div>
      </motion.div>

      {/* Preset / Sample Image Cards */}
      <div className="mt-12">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold tracking-wider uppercase text-slate-400">
              No photo on hand? Try instant vintage presets
            </h4>
          </div>
          <span className="text-xs text-purple-500 font-mono flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Direct Canvas Render
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Vintage Sepia Portrait */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative cursor-pointer bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-hidden"
            onClick={() => !loadingSample && generateSampleImage("portrait")}
          >
            <div className="h-40 w-full rounded-xl bg-orange-950/20 border border-amber-900/10 flex items-center justify-center relative overflow-hidden mb-3">
              <div className="absolute inset-0 bg-[#bd956f] flex flex-col items-center justify-center filter sepia contrast-125 opacity-70">
                <div className="w-14 h-14 rounded-full bg-[#523d29] mb-2 blur-[1px]"></div>
                <div className="w-24 h-12 rounded-t-full bg-[#523d29] blur-[1px]"></div>
                {/* Horizontal scratch */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-100 opacity-60"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
              <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-slate-900/80 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                HEAVY AGE DEGRADED
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-205 group-hover:text-white transition-colors">
                  Historic Sepia Portrait
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Face retouch, Scratch paint, Contrast
                </p>
              </div>
              {loadingSample === "portrait" && (
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              )}
            </div>
          </motion.div>

          {/* Card 2: Heritage Sepia Rose */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative cursor-pointer bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-hidden"
            onClick={() => !loadingSample && generateSampleImage("rose")}
          >
            <div className="h-40 w-full rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden mb-3">
              <div className="absolute inset-0 bg-slate-800/80 flex flex-col items-center justify-center opacity-60 filter grayscale">
                <div className="w-16 h-16 rounded-full border-4 border-slate-400 border-dashed animate-spin duration-1000 mb-2"></div>
                <div className="w-2 h-14 bg-slate-500"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
              <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-slate-900/80 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded">
                BLACK & WHITE ENTRANCE
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-205 group-hover:text-white transition-colors">
                  B&W Heritage Rose
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  AI Colorization, Texture recovery
                </p>
              </div>
              {loadingSample === "rose" && (
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              )}
            </div>
          </motion.div>

          {/* Card 3: Grainy Neon Skyline */}
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative cursor-pointer bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-hidden"
            onClick={() => !loadingSample && generateSampleImage("skyline")}
          >
            <div className="h-40 w-full rounded-xl bg-indigo-950/20 border border-indigo-900/10 flex items-center justify-center relative overflow-hidden mb-3">
              <div className="absolute inset-0 bg-indigo-950/20 flex gap-1 items-end p-2 blur-[2px]">
                <div className="w-8 h-20 bg-indigo-900"></div>
                <div className="w-12 h-28 bg-fuchsia-900"></div>
                <div className="w-10 h-16 bg-blue-900"></div>
                <div className="w-8 h-24 bg-violet-900"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
              <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-slate-900/80 text-fuchsia-400 border border-fuchsia-500/20 px-2 py-0.5 rounded">
                DIGITAL BLUR & GRAIN
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-slate-205 group-hover:text-white transition-colors">
                  Grainy Skyline
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Luminosity denoise, Lens sharpen
                </p>
              </div>
              {loadingSample === "skyline" && (
                <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
