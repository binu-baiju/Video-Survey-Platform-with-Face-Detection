export interface FaceDetectionResult {
  detected: boolean;
  faceCount: number;
  score: number | null;
  error: string | null;
}

// Simple face detection using MediaPipe (loaded dynamically)
export class FaceDetector {
  private faceDetection: any = null;
  private videoElement: HTMLVideoElement | null = null;
  private onResultsCallback: ((result: FaceDetectionResult) => void) | null =
    null;
  private detectionInterval: NodeJS.Timeout | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;

    // Dynamically load MediaPipe
    const { FaceDetection } = await import("@mediapipe/face_detection");
    const { Camera } = await import("@mediapipe/camera_utils");

    this.faceDetection = new FaceDetection({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
      },
    });

    this.faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.5,
    });

    this.faceDetection.onResults((results: any) => {
      if (this.onResultsCallback) {
        const result = this.processResults(results);
        this.onResultsCallback(result);
      }
    });

    // Create canvas for processing
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    // Initialize camera
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const camera = new Camera(this.videoElement, {
        onFrame: async () => {
          if (
            this.faceDetection &&
            this.videoElement &&
            this.canvas &&
            this.ctx
          ) {
            this.canvas.width = this.videoElement.videoWidth;
            this.canvas.height = this.videoElement.videoHeight;
            this.ctx.drawImage(this.videoElement, 0, 0);
            await this.faceDetection.send({ image: this.canvas });
          }
        },
        width: 640,
        height: 480,
      });
      await camera.start();
    } else {
      throw new Error("Camera not available");
    }
  }

  private processResults(results: any): FaceDetectionResult {
    if (!results.detections || results.detections.length === 0) {
      return {
        detected: false,
        faceCount: 0,
        score: null,
        error: "No face detected",
      };
    }

    if (results.detections.length > 1) {
      return {
        detected: false,
        faceCount: results.detections.length,
        score: null,
        error: "Multiple faces detected",
      };
    }

    const detection = results.detections[0];
    
    // Try to get score from different possible locations in MediaPipe response
    let rawScore: number | null = null;
    
    // Check various possible score locations
    if (detection.score !== undefined && detection.score !== null) {
      rawScore = detection.score;
    } else if (detection.detection?.score !== undefined && detection.detection.score !== null) {
      rawScore = detection.detection.score;
    } else if (detection.detection?.scoreArray?.[0] !== undefined) {
      rawScore = detection.detection.scoreArray[0];
    }
    
    // Calculate score from bounding box if no score available
    let finalScore: number;
    if (rawScore !== null && rawScore !== undefined) {
      // Convert to 0-100 scale
      finalScore = Math.round(rawScore * 100);
    } else if (detection.boundingBox) {
      // Fallback: calculate visibility score from bounding box
      const bbox = detection.boundingBox;
      const width = bbox.width || 0;
      const height = bbox.height || 0;
      
      // Calculate face area (normalized to frame size)
      const area = width * height;
      const normalizedArea = Math.min(1.0, area / 0.15); // 15% of frame = full score
      
      // Calculate centering score (faces closer to center are more visible)
      const xCenter = bbox.xCenter !== undefined ? bbox.xCenter : 0.5;
      const yCenter = bbox.yCenter !== undefined ? bbox.yCenter : 0.5;
      const centerDistance = Math.sqrt(
        Math.pow(xCenter - 0.5, 2) + Math.pow(yCenter - 0.5, 2)
      );
      const centerScore = Math.max(0, 1 - centerDistance * 2); // Closer = higher
      
      // Visibility = 60% area + 40% centering
      const visibilityFactor = normalizedArea * 0.6 + centerScore * 0.4;
      finalScore = Math.round(visibilityFactor * 100);
      
      // Ensure minimum score if face is detected (at least 20%)
      finalScore = Math.max(20, Math.min(100, finalScore));
    } else {
      // Default score if face is detected but no metrics available
      finalScore = 50; // Default moderate score
    }

    return {
      detected: true,
      faceCount: 1,
      score: finalScore,
      error: null,
    };
  }

  onResults(callback: (result: FaceDetectionResult) => void): void {
    this.onResultsCallback = callback;
  }

  async stop(): Promise<void> {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    if (this.faceDetection) {
      this.faceDetection.close();
      this.faceDetection = null;
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.videoElement.srcObject = null;
    }
    this.canvas = null;
    this.ctx = null;
  }

  async captureImage(): Promise<Blob | null> {
    if (!this.videoElement) return null;

    const canvas = document.createElement("canvas");
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0);
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
  }
}
