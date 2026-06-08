/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EnhancementSettings } from "../types";

/**
 * Perform heavy real-time image filter computations on Canvas pixels.
 * Uses optimized loops and offscreen buffers for flawless rendering.
 */
export function applyImageFilters(
  srcData: ImageData,
  settings: EnhancementSettings
): ImageData {
  const width = srcData.width;
  const height = srcData.height;
  const size = width * height;

  // Create workspace buffers
  const originalBytes = new Uint8ClampedArray(srcData.data);
  const tempBytes = new Uint8ClampedArray(srcData.data);
  const outBytes = new Uint8ClampedArray(srcData.data);

  // 1. Core adjustments: Brightness, Contrast, Saturation & Intelligent Colorization
  const brightnessVal = settings.brightness; // -50 to 50
  const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
  const satFactor = 1 + (settings.saturation / 50); // scales saturation cleanly

  // Dynamic Skin Tone Ranges for Portrait Retouching Filter
  const isSkin = (r: number, g: number, b: number) => {
    return r > 95 && g > 40 && b > 20 && r > g && r > b && (r - Math.min(g, b)) > 15 && Math.abs(r - g) > 15;
  };

  for (let i = 0; i < size * 4; i += 4) {
    let r = originalBytes[i];
    let g = originalBytes[i + 1];
    let b = originalBytes[i + 2];
    const a = originalBytes[i + 3];

    // Determine current luminance (Luma)
    let luma = 0.299 * r + 0.587 * g + 0.114 * b;

    // A. B&W to Color Gradient Multi-stage Mapping Colorization
    if (settings.colorize) {
      // Dynamic color projection mapping based on luminance thresholds
      if (luma < 60) {
        // Deep shadow mapping -> cool rich navy tones
        r = Math.min(255, luma * 0.7);
        g = Math.min(255, luma * 0.8 + 5);
        b = Math.min(255, luma * 1.3 + 15);
      } else if (luma < 175) {
        // Midtones -> warm terracotta & organic skin tones
        const ratio = (luma - 60) / 115;
        r = Math.min(255, luma * (1.1 + ratio * 0.2));
        g = Math.min(255, luma * (0.95 - ratio * 0.05));
        b = Math.min(255, luma * (0.8 - ratio * 0.1));
      } else {
        // Highlights -> soft golden light/sky tones
        const ratio = (luma - 175) / 80;
        r = Math.min(255, luma * (1.05 - ratio * 0.05));
        g = Math.min(255, luma * 1.02);
        b = Math.min(255, luma * (0.95 + ratio * 0.05));
      }
    }

    // B. Contrast Adjustments
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;

    // C. Brightness Adjustments
    r += brightnessVal;
    g += brightnessVal;
    b += brightnessVal;

    // Clip RGB values (clamp to 0-255)
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));

    // D. Saturation Adjustments
    luma = 0.299 * r + 0.587 * g + 0.114 * b;
    r = luma + satFactor * (r - luma);
    g = luma + satFactor * (g - luma);
    b = luma + satFactor * (b - luma);

    // Final clip
    tempBytes[i] = Math.min(255, Math.max(0, r));
    tempBytes[i + 1] = Math.min(255, Math.max(0, g));
    tempBytes[i + 2] = Math.min(255, Math.max(0, b));
    tempBytes[i + 3] = a;
  }

  // Set up second workspace
  outBytes.set(tempBytes);

  // 2. High-Grade Sharpening Core Convolution Matrix
  if (settings.sharpen > 0) {
    const strength = settings.sharpen / 100; // 0 to 1
    const kernel = [
      0,          -strength,           0,
      -strength,  1 + 4 * strength,   -strength,
      0,          -strength,           0
    ];

    // Read from tempBytes, write to outBytes
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const destIdx = (y * width + x) * 4;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
            const weight = kernel[(ky + 1) * 3 + (kx + 1)];

            rSum += tempBytes[pixelIdx] * weight;
            gSum += tempBytes[pixelIdx + 1] * weight;
            bSum += tempBytes[pixelIdx + 2] * weight;
          }
        }

        outBytes[destIdx] = Math.min(255, Math.max(0, rSum));
        outBytes[destIdx + 1] = Math.min(255, Math.max(0, gSum));
        outBytes[destIdx + 2] = Math.min(255, Math.max(0, bSum));
      }
    }
  }

  // Update tempBytes to hold sharpening outputs
  tempBytes.set(outBytes);

  // 3. Bilateral & Edge-Preserving Skin Smoothing and Denoising
  const smoothParam = settings.skinSmoothing; // 0 to 100
  const noiseReduction = settings.denoise;     // 0 to 100

  if (smoothParam > 0 || noiseReduction > 0) {
    // Spatial radius based on smoothing parameters (cap max for real-time compliance)
    const smoothRadius = Math.max(1, Math.min(3, Math.floor((smoothParam + noiseReduction) / 40) + 1));
    const smoothThreshold = 10 + (smoothParam + noiseReduction) / 2; // threshold of pixel-proximity deviation

    for (let y = smoothRadius; y < height - smoothRadius; y++) {
      for (let x = smoothRadius; x < width - smoothRadius; x++) {
        const idx = (y * width + x) * 4;
        const currentR = tempBytes[idx];
        const currentG = tempBytes[idx + 1];
        const currentB = tempBytes[idx + 2];

        // Is it a skin pixel? If so, we smooth heavily. If denoising, we smooth background too.
        const skinPix = isSkin(currentR, currentG, currentB);
        const shouldSmooth = (skinPix && smoothParam > 0) || (noiseReduction > 0);

        if (shouldSmooth) {
          let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;

          for (let ky = -smoothRadius; ky <= smoothRadius; ky++) {
            for (let kx = -smoothRadius; kx <= smoothRadius; kx++) {
              const neighborIdx = ((y + ky) * width + (x + kx)) * 4;
              const nR = tempBytes[neighborIdx];
              const nG = tempBytes[neighborIdx + 1];
              const nB = tempBytes[neighborIdx + 2];

              // Bilateral factor calculation: calculate luminance distance
              const luminanceDiff = Math.abs((nR + nG + nB)/3 - (currentR + currentG + currentB)/3);
              
              if (luminanceDiff < smoothThreshold) {
                // Closer color match -> high spatial blend weight
                const w = 1.0;
                rSum += nR * w;
                gSum += nG * w;
                bSum += nB * w;
                weightSum += w;
              }
            }
          }

          if (weightSum > 0) {
            // Apply smoothing interpolation
            const lerpFactor = skinPix ? (smoothParam / 100) : (noiseReduction / 100);
            outBytes[idx] = Math.round(currentR * (1 - lerpFactor) + (rSum / weightSum) * lerpFactor);
            outBytes[idx + 1] = Math.round(currentG * (1 - lerpFactor) + (gSum / weightSum) * lerpFactor);
            outBytes[idx + 2] = Math.round(currentB * (1 - lerpFactor) + (bSum / weightSum) * lerpFactor);
          }
        }
      }
    }
  }

  // Update tempBytes to hold smoothing outputs
  tempBytes.set(outBytes);

  // 4. Portrait Eye, Hair, and High-definition Detail Highlight
  if (settings.eyeClarity > 0) {
    const detailBoost = settings.eyeClarity / 100; // 0 to 1

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const currentR = tempBytes[idx];
        const currentG = tempBytes[idx + 1];
        const currentB = tempBytes[idx + 2];

        // Highlight eyes and hair details using a lightweight unsharp mask approximation
        // Calculate average of adjacent pixels
        const topIdx = ((y - 1) * width + x) * 4;
        const botIdx = ((y + 1) * width + x) * 4;
        const lIdx = (y * width + x - 1) * 4;
        const rIdx = (y * width + x + 1) * 4;

        const neighborLumaAvg = (
          (tempBytes[topIdx] + tempBytes[topIdx+1] + tempBytes[topIdx+2])/3 +
          (tempBytes[botIdx] + tempBytes[botIdx+1] + tempBytes[botIdx+2])/3 +
          (tempBytes[lIdx] + tempBytes[lIdx+1] + tempBytes[lIdx+2])/3 +
          (tempBytes[rIdx] + tempBytes[rIdx+1] + tempBytes[rIdx+2])/3
        ) / 4;

        const currentLuma = (currentR + currentG + currentB) / 3;
        const difference = currentLuma - neighborLumaAvg;

        // If local pixel dominates neighbor (strong edge region like hair lines or eye pupil highlights), boost contrast
        if (Math.abs(difference) > 8) {
          const detailScale = 1 + detailBoost * 0.4;
          outBytes[idx] = Math.min(255, Math.max(0, currentR + difference * detailBoost * 0.5));
          outBytes[idx + 1] = Math.min(255, Math.max(0, currentG + difference * detailBoost * 0.5));
          outBytes[idx + 2] = Math.min(255, Math.max(0, currentB + difference * detailBoost * 0.5));
        }
      }
    }
  }

  return new ImageData(outBytes, width, height);
}

/**
 * Image scaling / upscaling function using dynamic billinear mapping on off-screen context
 */
export function upscaleCanvasImage(
  sourceCanvas: HTMLCanvasElement,
  scale: 2 | 4 | 8
): HTMLCanvasElement {
  const scaledCanvas = document.createElement("canvas");
  const scaledCtx = scaledCanvas.getContext("2d")!;
  
  const targetWidth = sourceCanvas.width * scale;
  const targetHeight = sourceCanvas.height * scale;

  scaledCanvas.width = targetWidth;
  scaledCanvas.height = targetHeight;

  // Use crisp bicubic rendering in modern browsers
  scaledCtx.imageSmoothingEnabled = true;
  scaledCtx.imageSmoothingQuality = "high";
  scaledCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  // Apply subtle micro-sharpness boost directly to make upscale look crisp
  const imgData = scaledCtx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const temp = new Uint8ClampedArray(data);

  // Apply high pass convolution
  const kEdge = -0.05;
  const kCenter = 1.2;

  // Faster stride logic for giant upscaled images
  for (let y = 1; y < targetHeight - 1; y += 2) {
    for (let x = 1; x < targetWidth - 1; x += 2) {
      const idx = (y * targetWidth + x) * 4;
      const tIdx = ((y-1) * targetWidth + x) * 4;
      const bIdx = ((y+1) * targetWidth + x) * 4;
      const lIdx = (y * targetWidth + x - 1) * 4;
      const rIdx = (y * targetWidth + x + 1) * 4;

      for (let c = 0; c < 3; c++) {
        const componentVal = temp[idx + c] * kCenter +
          (temp[tIdx + c] + temp[bIdx + c] + temp[lIdx + c] + temp[rIdx + c]) * kEdge;
        data[idx + c] = Math.min(255, Math.max(0, componentVal));
      }
    }
  }

  scaledCtx.putImageData(imgData, 0, 0);
  return scaledCanvas;
}

/**
 * Perform directional neighborhood average inpainting on image scratches/blemishes.
 * Reads coordinates painted on mask canvas and diffuses adjacent colors inside selected area.
 */
export function repairScratchesOnCanvas(
  mainCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement
): void {
  const ctx = mainCanvas.getContext("2d")!;
  const maskCtx = maskCanvas.getContext("2d")!;

  const width = mainCanvas.width;
  const height = mainCanvas.height;

  const mainData = ctx.getImageData(0, 0, width, height);
  const maskData = maskCtx.getImageData(0, 0, width, height);

  const mData = mainData.data;
  const maskBytes = maskData.data;

  // Copy bytes for multi-pass diffuse logic
  const workingBytes = new Uint8ClampedArray(mData);

  const radius = 5; // Search boundary radius
  const iterations = 3; // Scratch diffusion passes

  for (let iter = 0; iter < iterations; iter++) {
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;

        // Check if pixel is masked (we treat pixels with high Alpha/Red value as scratch mask)
        const isMasked = maskBytes[idx] > 100 && maskBytes[idx + 3] > 100;

        if (isMasked) {
          let rSum = 0, gSum = 0, bSum = 0, unmaskedCount = 0;

          // Search in localized circle neighborhood
          for (let ky = -radius; ky <= radius; ky++) {
            for (let kx = -radius; kx <= radius; kx++) {
              const nIdx = ((y + ky) * width + (x + kx)) * 4;
              const neighborIsMasked = maskBytes[nIdx] > 100 && maskBytes[nIdx + 3] > 100;

              if (!neighborIsMasked) {
                rSum += workingBytes[nIdx];
                gSum += workingBytes[nIdx + 1];
                bSum += workingBytes[nIdx + 2];
                unmaskedCount++;
              }
            }
          }

          if (unmaskedCount > 0) {
            mData[idx] = Math.round(rSum / unmaskedCount);
            mData[idx + 1] = Math.round(gSum / unmaskedCount);
            mData[idx + 2] = Math.round(bSum / unmaskedCount);
            // Also fade the mask out slightly as we fill it
            maskBytes[idx] = 0;
            maskBytes[idx + 3] = 0;
          }
        }
      }
    }
    workingBytes.set(mData);
  }

  // Draw output back
  ctx.putImageData(mainData, 0, 0);

  // Clear mask canvas
  maskCtx.clearRect(0, 0, width, height);
}
