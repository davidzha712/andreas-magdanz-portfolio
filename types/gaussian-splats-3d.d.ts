declare module "@mkkellogg/gaussian-splats-3d" {
  import type { WebGLRenderer, PerspectiveCamera, Scene } from "three";

  interface ViewerOptions {
    selfDrivenMode?: boolean;
    renderer?: WebGLRenderer;
    camera?: PerspectiveCamera;
    scene?: Scene;
    useBuiltInControls?: boolean;
    sharedMemoryForWorkers?: boolean;
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
  }

  interface SplatSceneOptions {
    showLoadingUI?: boolean;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    addSplatScene(url: string, options?: SplatSceneOptions): Promise<void>;
    start(): void;
    update(): void;
    dispose(): void;
  }
}
