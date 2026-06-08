/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EnhancementSettings {
  sharpen: number;         // 0 - 100
  denoise: number;         // 0 - 100
  contrast: number;        // -50 to 50
  brightness: number;      // -50 to 50
  saturation: number;      // -50 to 50
  skinSmoothing: number;   // 0 - 100
  eyeClarity: number;      // 0 - 100
  colorize: boolean;       // B&W colorization
  upscale: 2 | 4 | 8;      // Bilinear Resolution Multiplier
}

export interface DiagnosisResult {
  photoType: string;
  detectedIssues: string[];
  advances: {
    sharpen: number;
    denoise: number;
    contrast: number;
    saturation: number;
    skinSmoothing: number;
    eyeClarity: number;
    colorize: boolean;
    upscalingFactor: number;
  };
  analysisDescription: string;
  simulationReason?: string;
}

export interface SavedPhoto {
  id: string;
  name: string;
  originalUrl: string;       // base64 source or resized base64
  enhancedUrl: string;       // base64 processed result
  timestamp: number;
  photoType: string;
  upscale: number;
}

export type AppTab = "home" | "enhance" | "gallery" | "settings";
