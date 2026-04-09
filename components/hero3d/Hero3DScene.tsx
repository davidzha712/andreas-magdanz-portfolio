"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap/gsapPlugins";
import { useHeadTracking } from "./useHeadTracking";
import { useOffAxisCamera } from "./useOffAxisCamera";
import { useInputFallback } from "./useInputFallback";

interface Hero3DSceneProps {
  splatUrl?: string;
  title?: string;
  subtitle?: string;
  scrollLabel?: string;
}

export default function Hero3DScene({
  splatUrl = "/models/hero.splat",
  title = "ANDREAS MAGDANZ",
  subtitle,
  scrollLabel = "Scroll",
}: Hero3DSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rafRef = useRef<number>(0);
  const splatViewerRef = useRef<unknown>(null);

  const headTracking = useHeadTracking();
  const fallbackInput = useInputFallback();
  const { updateCamera } = useOffAxisCamera();

  const [isLoaded, setIsLoaded] = useState(false);
  const [usingSplat, setUsingSplat] = useState(false);
  const [cameraPrompted, setCameraPrompted] = useState(false);

  // Active input source: prefer head tracking, fallback to mouse/gyro
  const activeInput = headTracking.isTracking
    ? headTracking.position
    : fallbackInput;

  // Initialize Three.js scene
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
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 0.6);
    cameraRef.current = camera;

    // Ambient light for the scene
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    return { renderer, scene, camera };
  }, []);

  // Load Gaussian Splat
  const loadSplat = useCallback(
    async (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => {
      try {
        const response = await fetch(splatUrl, { method: "HEAD" });
        if (!response.ok) {
          throw new Error(`Splat file not found: ${splatUrl}`);
        }

        const GaussianSplats3D = await import(
          "@mkkellogg/gaussian-splats-3d"
        );
        const viewer = new GaussianSplats3D.Viewer({
          selfDrivenMode: false,
          renderer,
          camera: cameraRef.current!,
          scene,
          useBuiltInControls: false,
          sharedMemoryForWorkers: false,
        });

        await viewer.addSplatScene(splatUrl, {
          showLoadingUI: false,
        });

        splatViewerRef.current = viewer;
        setUsingSplat(true);
        setIsLoaded(true);
      } catch {
        // Splat not available — fall back to panorama cube map
        loadPanoramaCube(scene);
      }
    },
    [splatUrl]
  );

  // Fallback: load panorama as a cube-textured sphere (equirectangular)
  const loadPanoramaCube = useCallback((scene: THREE.Scene) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      "/models/hambacher-forst-panorama.jpg",
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Create an inside-out sphere with the panorama
        const geometry = new THREE.SphereGeometry(10, 64, 32);
        geometry.scale(-1, 1, 1); // Invert so we see the inside
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        setIsLoaded(true);
      },
      undefined,
      () => {
        // Even panorama failed — show dark background
        scene.background = new THREE.Color(0x0a0a0a);
        setIsLoaded(true);
      }
    );
  }, []);

  // Main setup effect
  useEffect(() => {
    const result = initScene();
    if (!result) return;

    const { renderer, scene, camera } = result;

    loadSplat(scene, renderer);

    // Render loop
    const animate = () => {
      if (splatViewerRef.current) {
        const viewer = splatViewerRef.current as { update: () => void };
        viewer.update();
      }
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // Resize handler
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
      if (splatViewerRef.current) {
        const viewer = splatViewerRef.current as { dispose: () => void };
        try {
          viewer.dispose();
        } catch {
          // Viewer disposal can throw
        }
      }
    };
  }, [initScene, loadSplat]);

  // Update camera based on head/mouse/gyro input
  useEffect(() => {
    if (!cameraRef.current || !isLoaded) return;

    // For panorama sphere (non-splat), we do simpler rotation instead of off-axis
    if (!usingSplat) {
      const camera = cameraRef.current;
      // Rotate camera to look around the panorama sphere
      const targetLon = activeInput.x * 30 * (Math.PI / 180); // +-30 degrees
      const targetLat = activeInput.y * 15 * (Math.PI / 180); // +-15 degrees

      camera.rotation.set(0, 0, 0);
      camera.rotateY(-targetLon);
      camera.rotateX(targetLat);
      return;
    }

    // For splat scenes, use full off-axis projection
    updateCamera(cameraRef.current, activeInput);
  }, [activeInput, isLoaded, usingSplat, updateCamera]);

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
      {
        clipPath: "inset(0%)",
        opacity: 1,
        duration: 1.5,
        ease: "power3.inOut",
      }
    ).fromTo(
      textEl,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.8"
    );

    return () => {
      tl.kill();
    };
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

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-fg-muted/30 border-t-fg-muted" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent pointer-events-none" />

      {/* Camera enable prompt */}
      {isLoaded && !headTracking.isTracking && !cameraPrompted && (
        <button
          onClick={handleEnableCamera}
          className="absolute top-6 right-6 z-10 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-sans text-xs tracking-wider text-fg-muted backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <CameraIcon />
          <span>ENABLE HEAD TRACKING</span>
        </button>
      )}

      {/* Tracking active indicator */}
      {headTracking.isTracking && (
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 font-sans text-[10px] tracking-wider text-green-400/80">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          TRACKING
        </div>
      )}

      {/* Text overlay — bottom left (matches HeroSection style) */}
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
