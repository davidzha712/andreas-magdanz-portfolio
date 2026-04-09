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

          // Nose tip (landmark 1)
          const noseTip = landmarks[1];
          // Left eye outer (landmark 33), right eye outer (landmark 263)
          const leftEye = landmarks[33];
          const rightEye = landmarks[263];
          // Forehead (landmark 10)
          const forehead = landmarks[10];

          // X: horizontal head position (left/right turn)
          const eyeCenterX = (leftEye.x + rightEye.x) / 2;
          const rawX = -(eyeCenterX - 0.5) * 2; // Invert: webcam is mirrored

          // Y: head pitch (nod up/down) — measured by angle between
          // forehead-to-nose vector vs vertical. When looking down,
          // nose drops below eye line; when looking up, nose rises.
          const eyeCenterY = (leftEye.y + rightEye.y) / 2;
          const noseOffsetY = noseTip.y - eyeCenterY; // positive = nose below eyes
          const foreheadToEyeY = eyeCenterY - forehead.y; // face height reference
          // Normalize pitch: 0 = neutral, negative = looking up, positive = looking down
          const pitchRatio = foreheadToEyeY > 0.01
            ? (noseOffsetY / foreheadToEyeY - 1.2) // 1.2 = neutral nose-below-eyes ratio
            : 0;
          const rawY = clamp(-pitchRatio * 1.5, -1, 1); // Invert: look down → view down

          // Depth from inter-ocular distance (closer = larger distance)
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
