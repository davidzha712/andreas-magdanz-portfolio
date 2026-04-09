"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap/gsapPlugins";
import { useHeadTracking } from "./useHeadTracking";

// --- Constants ---
const DEG = Math.PI / 180;
const DRIFT_SPEED = 0.8; // deg/sec auto-rotate
const DRIFT_RESUME_PASSIVE = 4000; // ms before drift resumes after gaze
const DRIFT_RESUME_DRAG = 6000; // ms before drift resumes after drag
const GAZE_RANGE_H = 60; // deg horizontal range for gaze
const GAZE_RANGE_V = 50; // deg vertical range for gaze
const GAZE_DAMPING = 0.05; // lerp per frame (cinematic lag)
const DRAG_SENSITIVITY = 0.15; // deg per pixel
const DRAG_DECAY = 0.92; // momentum friction per frame
const MOUSE_GAZE_STRENGTH = 0.8;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

interface Hero3DSceneProps {
  panoramaUrl?: string;
  title?: string;
  subtitle?: string;
  scrollLabel?: string;
}

export default function Hero3DScene({
  panoramaUrl = "/models/hambacher-forst-panorama.jpg",
  title = "ANDREAS MAGDANZ",
  subtitle,
  scrollLabel = "Scroll",
}: Hero3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);

  const headTracking = useHeadTracking();

  const [isLoaded, setIsLoaded] = useState(false);
  const [cameraPrompted, setCameraPrompted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- Rotation state (mutable refs for animation loop) ---
  const driftLon = useRef(0); // ambient drift longitude (degrees)
  const driftActive = useRef(true);
  const driftResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gazeTargetH = useRef(0); // raw gaze target (degrees)
  const gazeTargetV = useRef(0);
  const gazeCurrentH = useRef(0); // smoothed gaze (degrees)
  const gazeCurrentV = useRef(0);

  const dragLon = useRef(0); // accumulated drag offset (degrees)
  const dragLat = useRef(0);
  const dragVelLon = useRef(0); // drag momentum
  const dragVelLat = useRef(0);
  const isDragging = useRef(false);

  const lastInputTime = useRef(0);

  // Pause drift and schedule resume
  const pauseDrift = useCallback((resumeDelay: number) => {
    driftActive.current = false;
    if (driftResumeTimer.current) clearTimeout(driftResumeTimer.current);
    driftResumeTimer.current = setTimeout(() => {
      driftActive.current = true;
    }, resumeDelay);
  }, []);

  // Initialize Three.js + load panorama
  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Load equirectangular panorama onto inverted sphere
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      panoramaUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geometry = new THREE.SphereGeometry(50, 64, 32);
        geometry.scale(-1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        scene.add(new THREE.Mesh(geometry, material));

        setIsLoaded(true);
      },
      undefined,
      () => {
        scene.background = new THREE.Color(0x0a0a0a);
        setIsLoaded(true);
      }
    );

    let lastTime = performance.now();

    // --- Main animation loop ---
    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000; // seconds
      lastTime = now;

      // Layer 1: Ambient drift
      if (driftActive.current && !isDragging.current) {
        driftLon.current += DRIFT_SPEED * dt;
      }

      // Layer 2: Gaze smoothing (heavy damping for cinematic feel)
      gazeCurrentH.current = lerp(gazeCurrentH.current, gazeTargetH.current, GAZE_DAMPING);
      gazeCurrentV.current = lerp(gazeCurrentV.current, gazeTargetV.current, GAZE_DAMPING);

      // Layer 3: Drag momentum decay
      if (!isDragging.current) {
        dragLon.current += dragVelLon.current;
        dragLat.current += dragVelLat.current;
        dragVelLon.current *= DRAG_DECAY;
        dragVelLat.current *= DRAG_DECAY;
        // Kill tiny velocities
        if (Math.abs(dragVelLon.current) < 0.001) dragVelLon.current = 0;
        if (Math.abs(dragVelLat.current) < 0.001) dragVelLat.current = 0;
      }

      // Combine all layers → final camera angles
      const finalLon = (driftLon.current + gazeCurrentH.current + dragLon.current) * DEG;
      const finalLat = clamp(gazeCurrentV.current + dragLat.current, -85, 85) * DEG;

      // Spherical to cartesian
      const target = new THREE.Vector3(
        -Math.sin(finalLon) * Math.cos(finalLat),
        Math.sin(finalLat),
        -Math.cos(finalLon) * Math.cos(finalLat)
      );
      camera.lookAt(target);

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [panoramaUrl]);

  useEffect(() => {
    setIsMobile(
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      ("ontouchstart" in window && window.innerWidth < 1024)
    );
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // --- Layer 2: Update gaze target from head tracking or mouse ---
  useEffect(() => {
    if (!isLoaded) return;

    if (headTracking.isTracking) {
      // Head tracking → gaze offset
      gazeTargetH.current = -headTracking.position.x * GAZE_RANGE_H;
      gazeTargetV.current = headTracking.position.y * GAZE_RANGE_V;
      pauseDrift(DRIFT_RESUME_PASSIVE);
      return;
    }

    // Mouse position → gaze offset (passive, always listening)
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      gazeTargetH.current = -x * GAZE_RANGE_H * MOUSE_GAZE_STRENGTH;
      gazeTargetV.current = y * GAZE_RANGE_V * MOUSE_GAZE_STRENGTH;
      pauseDrift(DRIFT_RESUME_PASSIVE);
    };

    // Device orientation → gaze offset (mobile)
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      gazeTargetH.current = clamp((-e.gamma / 45) * GAZE_RANGE_H, -GAZE_RANGE_H, GAZE_RANGE_H);
      gazeTargetV.current = clamp(((e.beta - 45) / 45) * GAZE_RANGE_V, -GAZE_RANGE_V, GAZE_RANGE_V);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("deviceorientation", onOrientation);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [isLoaded, headTracking.isTracking, headTracking.position, pauseDrift]);

  // --- Layer 3: Click-drag / touch-drag ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;

    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      lastX = e.clientX;
      lastY = e.clientY;
      dragVelLon.current = 0;
      dragVelLat.current = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
      setHasInteracted(true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      // Drag left → view pans left (positive longitude)
      dragVelLon.current = dx * DRAG_SENSITIVITY;
      dragVelLat.current = -dy * DRAG_SENSITIVITY;
      dragLon.current += dragVelLon.current;
      dragLat.current += dragVelLat.current;
      dragLat.current = clamp(dragLat.current, -85, 85);
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const onPointerUp = () => {
      isDragging.current = false;
      canvas.style.cursor = "grab";
      pauseDrift(DRIFT_RESUME_DRAG);
    };

    // Prevent default touch scrolling on canvas so drag works on mobile
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); };

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none"; // Critical for mobile drag
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("touchstart", onTouchStart);
    };
  }, [isLoaded, pauseDrift]);

  // GSAP entrance animation
  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl || !isLoaded) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set(container, { clipPath: "inset(0%)", opacity: 1 });
      gsap.set(textEl, { opacity: 1 });
      return;
    }

    const tl = gsap.timeline();
    tl.fromTo(
      container,
      { clipPath: "inset(15%)", opacity: 0 },
      { clipPath: "inset(0%)", opacity: 1, duration: 1.5, ease: "power3.inOut" }
    ).fromTo(
      textEl,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.8"
    );

    return () => { tl.kill(); };
  }, [isLoaded]);

  const handleEnableCamera = () => {
    setCameraPrompted(true);
    setHasInteracted(true);
    headTracking.requestPermission();
  };

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0 opacity-0">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      {/* Loading spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg-muted/30 border-t-fg-muted" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent pointer-events-none" />

      {/* Camera enable button (desktop only) */}
      {isLoaded && !isMobile && !headTracking.isTracking && !cameraPrompted && (
        <button
          onClick={handleEnableCamera}
          className="absolute top-6 right-6 z-10 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-sans text-xs tracking-wider text-fg-muted backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <CameraIcon />
          <span>ENABLE HEAD TRACKING</span>
        </button>
      )}

      {/* Tracking indicator */}
      {headTracking.isTracking && (
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 font-sans text-[10px] tracking-wider text-green-400/80">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          TRACKING
        </div>
      )}

      {/* Drag hint — fades after first interaction */}
      {isLoaded && !hasInteracted && (
        <div className="absolute bottom-28 right-8 z-10 flex items-center gap-2 text-fg-muted/50 animate-pulse pointer-events-none">
          <DragIcon />
          <span className="font-sans text-[10px] tracking-widest uppercase">
            DRAG TO EXPLORE
          </span>
        </div>
      )}

      {/* Text overlay */}
      <div
        ref={textRef}
        className="absolute bottom-16 left-8 md:left-12 lg:left-16 opacity-0 z-10"
      >
        <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl tracking-tight text-fg leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 font-sans text-sm tracking-widest uppercase text-fg-muted">
            {subtitle}
          </p>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-fg-muted/60 z-10">
        <span className="font-sans text-[10px] tracking-widest uppercase">
          {scrollLabel}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="animate-bounce"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </section>
  );
}

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function DragIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l-3 3 3 3" />
      <path d="M19 9l3 3-3 3" />
      <path d="M2 12h20" />
    </svg>
  );
}
