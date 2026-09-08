"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Camera,
  Upload,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface PhotoCaptureProps {
  onPhotoCaptured?: (photoDataUrl: string) => void;
  onPhotoSelected?: (photoDataUrl: string) => void;
  initialPhotoUrl?: string | null;
}

export default function PhotoCapture({
  onPhotoCaptured,
  onPhotoSelected,
  initialPhotoUrl,
}: PhotoCaptureProps) {
  const [mode, setMode] = useState<"choose" | "webcam" | "crop" | "preview">(
    initialPhotoUrl ? "preview" : "choose"
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    initialPhotoUrl || null
  );
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Crop & Adjust states
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  // Stop Webcam stream safely
  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  // Attach stream when video element mounts in webcam mode
  useEffect(() => {
    if (mode === "webcam" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => console.warn("Video play error:", err));
    }
  }, [mode]);

  // Start Webcam
  const startWebcam = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = stream;
      setMode("webcam");
    } catch (err: unknown) {
      console.error(err);
      setCameraError(
        "Accès à la caméra refusé ou non supporté. Veuillez importer une photo depuis votre appareil."
      );
    }
  };

  // Capture frame from webcam
  const captureWebcamFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    stopWebcam();

    setRawImage(dataUrl);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setMode("crop");
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setRawImage(result);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setMode("crop");
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing for interactive crop preview
  useEffect(() => {
    if (mode !== "crop" || !rawImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.src = rawImage;
    imageElementRef.current = img;

    img.onload = () => {
      // Set canvas size (square 400x400 for standard passport photo)
      canvas.width = 400;
      canvas.height = 400;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();

      // Center transformations
      ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Draw image centered
      const drawWidth = canvas.width;
      const drawHeight = (img.height / img.width) * drawWidth;
      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      ctx.restore();
    };
  }, [mode, rawImage, zoom, rotation, pan]);

  // Export cropped final photo
  const handleValidateCrop = () => {
    if (!canvasRef.current) return;
    const finalDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92);
    setPhotoPreview(finalDataUrl);
    if (typeof onPhotoCaptured === "function") {
      onPhotoCaptured(finalDataUrl);
    }
    if (typeof onPhotoSelected === "function") {
      onPhotoSelected(finalDataUrl);
    }
    setMode("preview");
  };

  // Mouse & Touch pan handlers for crop canvas (Desktop + Mobile)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="w-full bg-[#091733] border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Title & Guidance */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37] block">
            Étape Indispensable
          </span>
          <h3 className="text-lg font-bold text-white">
            Photo d&apos;Identité Officielle pour le Badge
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Format 4x4 officiel</span>
        </div>
      </div>

      {cameraError && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* MODE 1: CHOOSE (Camera or Upload) */}
      {mode === "choose" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          <button
            type="button"
            onClick={startWebcam}
            className="flex flex-col items-center justify-center p-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 transition-all duration-200 group text-center"
          >
            <div className="w-14 h-14 rounded-full bg-[#0B3C8A]/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-3 group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7" />
            </div>
            <span className="font-bold text-white text-sm">
              Prendre avec la Webcam
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Prise de vue directe instantanée
            </span>
          </button>

          <label className="flex flex-col items-center justify-center p-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 transition-all duration-200 group text-center cursor-pointer">
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-full bg-[#0B3C8A]/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <span className="font-bold text-white text-sm">
              Importer depuis l&apos;Appareil
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Fichiers JPG, PNG ou WebP
            </span>
          </label>
        </div>
      )}

      {/* MODE 2: WEBCAM LIVE STREAM */}
      {mode === "webcam" && (
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-72 h-72 rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-black shadow-2xl">
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch((err) => console.warn("play err:", err));
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Guide Silhouette Overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/40 rounded-full m-8 flex items-center justify-center">
              <span className="text-[10px] text-white/60 uppercase tracking-widest font-semibold bg-black/40 px-2 py-0.5 rounded">
                Centrez votre visage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={captureWebcamFrame}
              className="px-6 py-2.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center gap-2 text-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Prendre la photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopWebcam();
                setMode("choose");
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: CROP & ADJUST */}
      {mode === "crop" && (
        <div className="flex flex-col items-center space-y-5">
          <p className="text-xs text-slate-300">
            Ajustez le cadrage : glissez pour déplacer l&apos;image et utilisez les boutons de zoom.
          </p>

          {/* Interactive Canvas */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-2 border-[#D4AF37] bg-[#060e1d] shadow-2xl cursor-grab active:cursor-grabbing">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              className="w-full h-full object-cover touch-none"
            />

            {/* Passport Oval Overlay */}
            <div className="absolute inset-0 pointer-events-none border border-dashed border-[#D4AF37]/50 rounded-full m-6" />
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-3 bg-white/[0.04] p-2 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-slate-400 font-mono text-[11px] w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Zoomer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Pivoter de 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setPan({ x: 0, y: 0 });
              }}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Réinitialiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleValidateCrop}
              className="px-6 py-2.5 rounded-xl font-bold text-[#060d1d] bg-gradient-to-r from-[#D4AF37] via-[#F3DE8A] to-[#D4AF37] hover:brightness-105 shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" />
              <span>Valider le Cadrage</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("choose")}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Changer d&apos;image
            </button>
          </div>
        </div>
      )}

      {/* MODE 4: PREVIEW VALIDATED */}
      {mode === "preview" && photoPreview && (
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="relative w-28 h-28 rounded-xl overflow-hidden border-2 border-[#D4AF37] shadow-lg shrink-0">
            <Image
              src={photoPreview}
              alt="Photo d'identité validée"
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <Check className="w-3 h-3" />
              <span>Photo d&apos;identité conforme et validée</span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm">
              Cette photo sera imprimée numériquement sur votre carte officielle de membre EEA.
            </p>

            <button
              type="button"
              onClick={() => setMode("choose")}
              className="inline-flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline pt-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reprendre ou changer de photo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
