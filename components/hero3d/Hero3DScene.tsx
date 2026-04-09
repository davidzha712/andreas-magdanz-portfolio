"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap/gsapPlugins";
import { useHeadTracking } from "./useHeadTracking";
import { useInputFallback } from "./useInputFallback";

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
  const fallbackInput = useInputFallback();

  const [isLoaded, setIsLoaded] = useState(false);
  const [cameraPrompted, setCameraPrompted] = useState(false);

  const activeInput = headTracking.isTracking
    ? headTracking.position
    : fallbackInput;

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

    // Load equirectangular panorama onto an inverted sphere
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      panoramaUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const geometry = new THREE.SphereGeometry(50, 64, 32);
        geometry.scale(-1, 1, 1); // Invert normals to see inside
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

    // Render loop
    const animate = () => {
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
    const cleanup = initScene();
    return cleanup;
  }, [initScene]);

  // Update camera rotation from head / mouse / gyro input
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera || !isLoaded) return;

    // Map input to look-around angles
    // Head tracking: +-40 degrees horizontal, +-20 degrees vertical
    // Creates a natural "window" feel
    const lon = -activeInput.x * 40 * (Math.PI / 180);
    const lat = activeInput.y * 20 * (Math.PI / 180);

    // Spherical to cartesian — camera looks at point on sphere
    const target = new THREE.Vector3(
      -Math.sin(lon) * Math.cos(lat),
      Math.sin(lat),
      -Math.cos(lon) * Math.cos(lat)
    );
    camera.lookAt(target);
  }, [activeInput, isLoaded]);

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
    headTracking.requestPermission();
  };

  return (
    <section className="relative h-screen overflow-hidden bg-black">
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0 opacity-0">
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

      {/* Camera enable button */}
      {isLoaded && !headTracking.isTracking && !cameraPrompted && (
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
