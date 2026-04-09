"use client";

import { useEffect, useRef, useState } from "react";
import type { HeadPosition } from "./useHeadTracking";

const SMOOTHING = 0.08;
const MOUSE_STRENGTH = 0.6;
const GYRO_STRENGTH = 0.4;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Fallback input when camera is unavailable:
 * - Desktop: mouse position → parallax
 * - Mobile: device orientation (gyroscope) → parallax
 */
export function useInputFallback(): HeadPosition {
  const targetRef = useRef<HeadPosition>({ x: 0, y: 0, z: 1.0 });
  const smoothedRef = useRef<HeadPosition>({ x: 0, y: 0, z: 1.0 });
  const [position, setPosition] = useState<HeadPosition>({ x: 0, y: 0, z: 1.0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const hasGyro = "DeviceOrientationEvent" in window;
    let gyroActive = false;

    // Mouse handler (desktop)
    const onMouseMove = (e: MouseEvent) => {
      if (gyroActive) return;
      const x = ((e.clientX / window.innerWidth) * 2 - 1) * MOUSE_STRENGTH;
      const y = -((e.clientY / window.innerHeight) * 2 - 1) * MOUSE_STRENGTH;
      targetRef.current = { x: clamp(x, -1, 1), y: clamp(y, -1, 1), z: 1.0 };
    };

    // Gyroscope handler (mobile)
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      gyroActive = true;
      const x = clamp((e.gamma / 45) * GYRO_STRENGTH, -1, 1);
      const y = clamp(((e.beta - 45) / 45) * GYRO_STRENGTH, -1, 1);
      targetRef.current = { x, y, z: 1.0 };
    };

    window.addEventListener("mousemove", onMouseMove);
    if (hasGyro) {
      window.addEventListener("deviceorientation", onOrientation);
    }

    // Smoothing loop
    const animate = () => {
      smoothedRef.current = {
        x: lerp(smoothedRef.current.x, targetRef.current.x, SMOOTHING),
        y: lerp(smoothedRef.current.y, targetRef.current.y, SMOOTHING),
        z: lerp(smoothedRef.current.z, targetRef.current.z, SMOOTHING),
      };
      setPosition({ ...smoothedRef.current });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (hasGyro) {
        window.removeEventListener("deviceorientation", onOrientation);
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return position;
}
