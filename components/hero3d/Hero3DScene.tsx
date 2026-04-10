"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap/gsapPlugins";
import { useHeadTracking } from "./useHeadTracking";

// --- Constants ---
const DEG = Math.PI / 180;
const DRIFT_SPEED = 1.2;
const DRIFT_RESUME_PASSIVE = 4000;
const DRIFT_RESUME_DRAG = 6000;
const GAZE_RANGE_H = 60;
const GAZE_RANGE_V = 50;
// Heavier damping (0.03) reduces motion sickness — VR research recommends
// constant speed + heavy smoothing over responsive-but-jerky movement
const GAZE_DAMPING = 0.03;
const DRAG_SENSITIVITY_DESKTOP = 0.25;
const DRAG_SENSITIVITY_MOBILE = 0.35;
const DRAG_DECAY = 0.95;
const MOUSE_GAZE_STRENGTH = 0.8;
// Head tracking: reduced range to prevent dizziness (VR best practice:
// limit angular velocity, prefer gradual movement)
const HEAD_TRACK_RANGE_H = 40; // was 60, reduced
const HEAD_TRACK_RANGE_V = 35; // was 50, reduced

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
  const isMobileRef = useRef(false);

  // --- Rotation state ---
  const driftLon = useRef(0);
  const driftActive = useRef(true);
  const driftResumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gazeTargetH = useRef(0);
  const gazeTargetV = useRef(0);
  const gazeCurrentH = useRef(0);
  const gazeCurrentV = useRef(0);
  const gyroActive = useRef(false);

  const dragLon = useRef(0);
  const dragLat = useRef(0);
  const dragVelLon = useRef(0);
  const dragVelLat = useRef(0);
  const isDragging = useRef(false);

  const pauseDrift = useCallback((resumeDelay: number) => {
    driftActive.current = false;
    if (driftResumeTimer.current) clearTimeout(driftResumeTimer.current);
    driftResumeTimer.current = setTimeout(() => {
      driftActive.current = true;
    }, resumeDelay);
  }, []);

  // --- Get real viewport height (accounts for browser chrome) ---
  const getViewportHeight = useCallback(() => {
    // Use visualViewport API if available (most accurate on mobile)
    if (window.visualViewport) {
      return window.visualViewport.height;
    }
    return window.innerHeight;
  }, []);

  // Initialize Three.js + load panorama
  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mobile = isMobileRef.current;
    const vh = getViewportHeight();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, vh);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();

    const isPortrait = vh > window.innerWidth;
    const fov = isPortrait ? 90 : 75;

    const camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / vh,
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

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (driftActive.current && !isDragging.current && !gyroActive.current) {
        driftLon.current += DRIFT_SPEED * dt;
      }

      gazeCurrentH.current = lerp(gazeCurrentH.current, gazeTargetH.current, GAZE_DAMPING);
      gazeCurrentV.current = lerp(gazeCurrentV.current, gazeTargetV.current, GAZE_DAMPING);

      if (!isDragging.current) {
        dragLon.current += dragVelLon.current;
        dragLat.current += dragVelLat.current;
        dragVelLon.current *= DRAG_DECAY;
        dragVelLat.current *= DRAG_DECAY;
        if (Math.abs(dragVelLon.current) < 0.005) dragVelLon.current = 0;
        if (Math.abs(dragVelLat.current) < 0.005) dragVelLat.current = 0;
      }

      const finalLon = (driftLon.current + gazeCurrentH.current + dragLon.current) * DEG;
      const finalLat = clamp(gazeCurrentV.current + dragLat.current, -85, 85) * DEG;

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

    // Resize + orientation change — use visualViewport for accurate height
    const onResize = () => {
      const newVh = getViewportHeight();
      const portrait = newVh > window.innerWidth;
      camera.fov = portrait ? 90 : 75;
      camera.aspect = window.innerWidth / newVh;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, newVh);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);

      // Dispose all GPU resources to prevent memory leaks
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if (!m) return;
            Object.values(m).forEach((v) => {
              if (v instanceof THREE.Texture) v.dispose();
            });
            m.dispose();
          });
        }
      });

      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.remove();
      }
    };
  }, [panoramaUrl, getViewportHeight]);

  useEffect(() => {
    const mobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      ("ontouchstart" in window && window.innerWidth < 1024);
    setIsMobile(mobile);
    isMobileRef.current = mobile;
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // --- Layer 2: Gaze from head tracking / mouse / gyroscope ---

  const filteredGamma = useRef(0);
  const filteredBeta = useRef(60);
  const GYRO_FILTER = 0.1; // heavier filtering (was 0.15)

  useEffect(() => {
    if (!isLoaded) return;

    if (headTracking.isTracking) {
      // Use reduced range for head tracking to prevent dizziness
      gazeTargetH.current = headTracking.position.x * HEAD_TRACK_RANGE_H;
      gazeTargetV.current = headTracking.position.y * HEAD_TRACK_RANGE_V;
      pauseDrift(DRIFT_RESUME_PASSIVE);
      return;
    }

    // Mouse → gaze (desktop)
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current || gyroActive.current) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      gazeTargetH.current = -x * GAZE_RANGE_H * MOUSE_GAZE_STRENGTH;
      gazeTargetV.current = y * GAZE_RANGE_V * MOUSE_GAZE_STRENGTH;
      pauseDrift(DRIFT_RESUME_PASSIVE);
    };

    // Gyroscope → gaze (mobile)
    // Uses screen.orientation to handle portrait vs landscape correctly
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      gyroActive.current = true;

      const gamma = clamp(e.gamma, -80, 80);
      const beta = clamp(e.beta, -10, 130);

      // Low-pass filter
      filteredGamma.current += (gamma - filteredGamma.current) * GYRO_FILTER;
      filteredBeta.current += (beta - filteredBeta.current) * GYRO_FILTER;

      // Detect orientation: screen.orientation.angle is 0=portrait, 90=landscape-left, -90/270=landscape-right
      const angle = screen.orientation?.angle ?? 0;

      let gazeH: number;
      let gazeV: number;

      if (angle === 0 || angle === 180) {
        // Portrait: gamma = left/right tilt, beta = forward/back tilt
        gazeH = (filteredGamma.current / 45) * GAZE_RANGE_H;
        gazeV = ((filteredBeta.current - 60) / 40) * GAZE_RANGE_V;
      } else if (angle === 90) {
        // Landscape left: axes swap — beta becomes left/right, gamma becomes up/down
        gazeH = ((filteredBeta.current - 60) / 40) * GAZE_RANGE_H;
        gazeV = -(filteredGamma.current / 45) * GAZE_RANGE_V;
      } else {
        // Landscape right (270/-90): axes swap and invert
        gazeH = -((filteredBeta.current - 60) / 40) * GAZE_RANGE_H;
        gazeV = (filteredGamma.current / 45) * GAZE_RANGE_V;
      }

      gazeTargetH.current = clamp(gazeH, -GAZE_RANGE_H, GAZE_RANGE_H);
      gazeTargetV.current = clamp(gazeV, -GAZE_RANGE_V, GAZE_RANGE_V);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("deviceorientation", onOrientation);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [isLoaded, headTracking.isTracking, headTracking.position, pauseDrift]);

  // --- Layer 3: Drag / touch-drag ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isLoaded) return;

    let lastX = 0;
    let lastY = 0;

    const sensitivity = isMobileRef.current
      ? DRAG_SENSITIVITY_MOBILE
      : DRAG_SENSITIVITY_DESKTOP;

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
      dragVelLon.current = dx * sensitivity;
      dragVelLat.current = dy * sensitivity;
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

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
    };
  }, [isLoaded, pauseDrift]);

  // --- iOS gyroscope permission ---
  const requestGyroPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOE.requestPermission === "function") {
      try {
        const permission = await DOE.requestPermission();
        if (permission === "granted") {
          gyroActive.current = true;
        }
      } catch {
        // User denied
      }
    }
    setHasInteracted(true);
  }, []);

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
    <section
      className="relative overflow-hidden bg-black"
      style={{ height: "100svh" }}
    >
      {/* 3D Canvas — uses visualViewport height */}
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

      {/* Desktop: head tracking button */}
      {isLoaded && !isMobile && !headTracking.isTracking && !cameraPrompted && (
        <button
          onClick={handleEnableCamera}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 font-sans text-[10px] sm:text-xs tracking-wider text-fg-muted backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <CameraIcon />
          <span>ENABLE HEAD TRACKING</span>
        </button>
      )}

      {/* Mobile: gyroscope enable button */}
      {isLoaded && isMobile && !gyroActive.current && !hasInteracted && (
        <button
          onClick={requestGyroPermission}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-sans text-[10px] tracking-wider text-fg-muted backdrop-blur-sm"
        >
          <GyroIcon />
          <span>ENABLE GYROSCOPE</span>
        </button>
      )}

      {/* Tracking indicator */}
      {headTracking.isTracking && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 font-sans text-[10px] tracking-wider text-green-400/80">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          TRACKING
        </div>
      )}

      {/* Drag hint */}
      {isLoaded && !hasInteracted && (
        <div className="absolute bottom-32 sm:bottom-28 right-4 sm:right-8 z-10 flex items-center gap-2 text-fg-muted/50 animate-pulse pointer-events-none">
          <DragIcon />
          <span className="font-sans text-[10px] tracking-widest uppercase">
            {isMobile ? "SWIPE TO EXPLORE" : "DRAG TO EXPLORE"}
          </span>
        </div>
      )}

      {/* Text overlay — responsive with word break for long names */}
      <div
        ref={textRef}
        className="absolute bottom-14 sm:bottom-16 left-4 right-4 sm:left-8 sm:right-8 md:left-12 md:right-12 lg:left-16 lg:right-auto opacity-0 z-10"
      >
        <h1
          className="font-serif tracking-tight text-fg leading-[0.9] break-words"
          style={{ fontSize: "clamp(1.5rem, 7vw, 8rem)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-1.5 sm:mt-3 font-sans tracking-widest uppercase text-fg-muted"
            style={{ fontSize: "clamp(0.55rem, 1.5vw, 0.875rem)" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 text-fg-muted/60 z-10">
        <span className="font-sans text-[9px] sm:text-[10px] tracking-widest uppercase">
          {scrollLabel}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          strokeLinejoin="round" aria-hidden="true" className="animate-bounce">
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

function GyroIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
