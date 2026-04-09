"use client";

import { useCallback } from "react";
import * as THREE from "three";
import type { HeadPosition } from "./useHeadTracking";

interface OffAxisConfig {
  /** Physical screen width in meters (default: 0.34 for ~14" laptop) */
  screenWidth: number;
  /** Physical screen height in meters (default: 0.21) */
  screenHeight: number;
  /** Base distance from screen in meters (default: 0.6) */
  baseDistance: number;
  /** Parallax strength multiplier (default: 1.0) */
  strength: number;
  near: number;
  far: number;
}

const DEFAULT_CONFIG: OffAxisConfig = {
  screenWidth: 0.34,
  screenHeight: 0.21,
  baseDistance: 0.6,
  strength: 1.0,
  near: 0.1,
  far: 100,
};

/**
 * Converts head position to camera parameters and updates the
 * Three.js camera's projection matrix for off-axis perspective.
 *
 * The math: we treat the screen as a physical window. The viewer's
 * head position determines where they're looking through that window,
 * creating an asymmetric frustum that produces the parallax illusion.
 */
export function useOffAxisCamera(config: Partial<OffAxisConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const updateCamera = useCallback(
    (camera: THREE.PerspectiveCamera, head: HeadPosition) => {
      const halfW = cfg.screenWidth / 2;
      const halfH = cfg.screenHeight / 2;

      // Convert normalized head position to physical offset (meters)
      const eyeX = head.x * halfW * cfg.strength;
      const eyeY = head.y * halfH * cfg.strength;
      const eyeZ = cfg.baseDistance * head.z;

      // Compute asymmetric frustum planes
      const nOverD = cfg.near / eyeZ;
      const left = (-halfW - eyeX) * nOverD;
      const right = (halfW - eyeX) * nOverD;
      const bottom = (-halfH - eyeY) * nOverD;
      const top = (halfH - eyeY) * nOverD;

      // Set custom projection matrix
      camera.projectionMatrix.makePerspective(
        left,
        right,
        top,
        bottom,
        cfg.near,
        cfg.far
      );
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

      // Move camera to match eye position, looking at origin
      camera.position.set(eyeX, eyeY, eyeZ);
      camera.lookAt(0, 0, 0);
    },
    [cfg.screenWidth, cfg.screenHeight, cfg.baseDistance, cfg.strength, cfg.near, cfg.far]
  );

  return { updateCamera };
}
