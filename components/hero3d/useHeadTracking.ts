"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface HeadPosition {
  x: number; // -1 to 1 (left to right)
  y: number; // -1 to 1 (down to up)
  z: number; // 0.5 to 2.0 (close to far)
}

interface HeadTrackingState {
  position: HeadPosition;
  isTracking: boolean;
  error: string | null;
  requestPermission: () => void;
}

const DEFAULT_POSITION: HeadPosition = { x: 0, y: 0, z: 1.0 };
const SMOOTHING = 0.15;

// Blend weights: rotation (yaw/pitch) vs position (face location in frame)
const ROTATION_WEIGHT = 0.85;
const POSITION_WEIGHT = 0.15;
const YAW_SENSITIVITY = 2.5; // ~30 deg head turn → full pan
const PITCH_SENSITIVITY = 2.0; // pitch feels less natural, lower gain
const POSITION_SENSITIVITY = 0.4; // subtle parallax from position

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function useHeadTracking(): HeadTrackingState {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const positionRef = useRef<HeadPosition>({ ...DEFAULT_POSITION });
  const smoothedRef = useRef<HeadPosition>({ ...DEFAULT_POSITION });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceLandmarkerRef = useRef<unknown>(null);
  const rafRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);

  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (videoRef.current) {
      const tracks = videoRef.current.srcObject as MediaStream | null;
      tracks?.getTracks().forEach((t) => t.stop());
      videoRef.current = null;
    }
    faceLandmarkerRef.current = null;
    setIsTracking(false);
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      videoRef.current = video;

      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(
        filesetResolver,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFacialTransformationMatrixes: false,
          outputFaceBlendshapes: false,
        }
      );

      faceLandmarkerRef.current = faceLandmarker;
      setIsTracking(true);

      const detect = () => {
        if (!videoRef.current || !faceLandmarkerRef.current) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fl = faceLandmarkerRef.current as any;
        const results = fl.detectForVideo(
          videoRef.current,
          performance.now()
        );

        if (results.faceLandmarks?.length > 0) {
          const landmarks = results.faceLandmarks[0];

          const noseTip = landmarks[1]; // Nose tip
          const leftEye = landmarks[33]; // Left eye outer
          const rightEye = landmarks[263]; // Right eye outer
          const forehead = landmarks[10]; // Forehead center
          const chin = landmarks[152]; // Chin

          // --- ROTATION component (primary, 85%) ---

          // Yaw: nose offset relative to eye midpoint, normalized by eye distance
          const eyeDistance = rightEye.x - leftEye.x;
          const eyeMidX = (leftEye.x + rightEye.x) / 2;
          const noseDeltaX = noseTip.x - eyeMidX;
          const halfEyeDist = Math.max(eyeDistance * 0.5, 0.01);
          // asin gives rotation angle; clamp input to [-1,1] for safety
          const yaw = Math.asin(clamp(noseDeltaX / halfEyeDist, -1, 1));

          // Pitch: nose offset below eye line, normalized by face height
          const faceHeight = Math.max(chin.y - forehead.y, 0.01);
          const eyeMidY = (leftEye.y + rightEye.y) / 2;
          const noseDeltaY = noseTip.y - (forehead.y + faceHeight * 0.45);
          const pitch = Math.asin(
            clamp(noseDeltaY / (faceHeight * 0.5), -1, 1)
          );

          // Normalize rotation to [-1, 1] range
          const rotX = clamp(yaw * YAW_SENSITIVITY, -1, 1);
          const rotY = clamp(-pitch * PITCH_SENSITIVITY, -1, 1);

          // --- POSITION component (secondary, 15%) ---
          // Raw face center position in frame (0-1 → -1 to 1)
          const posX = -(eyeMidX - 0.5) * 2; // Invert: webcam is mirrored
          const posY = -(eyeMidY - 0.5) * 2; // Invert: webcam Y is top-down

          // --- BLEND rotation + position ---
          const rawX = (ROTATION_WEIGHT * rotX) +
            (POSITION_WEIGHT * posX * POSITION_SENSITIVITY);
          const rawY = (ROTATION_WEIGHT * rotY) +
            (POSITION_WEIGHT * posY * POSITION_SENSITIVITY);

          // Depth from inter-ocular distance
          const eyeDist = Math.sqrt(
            (rightEye.x - leftEye.x) ** 2 + (rightEye.y - leftEye.y) ** 2
          );
          const baseEyeDist = 0.15;
          const rawZ = clamp(baseEyeDist / eyeDist, 0.5, 2.0);

          positionRef.current = {
            x: clamp(rawX, -1, 1),
            y: clamp(rawY, -1, 1),
            z: rawZ,
          };
        }

        // Exponential smoothing
        smoothedRef.current = {
          x: lerp(smoothedRef.current.x, positionRef.current.x, SMOOTHING),
          y: lerp(smoothedRef.current.y, positionRef.current.y, SMOOTHING),
          z: lerp(smoothedRef.current.z, positionRef.current.z, SMOOTHING),
        };

        forceUpdate((n) => n + 1);
        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Camera access denied";
      setError(message);
      setIsTracking(false);
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    position: smoothedRef.current,
    isTracking,
    error,
    requestPermission,
  };
}
