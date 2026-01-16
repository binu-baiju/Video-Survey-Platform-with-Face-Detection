"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, AlertCircle, Video } from "lucide-react";
import Link from "next/link";

interface CameraPermissionProps {
  surveyTitle?: string;
  onPermissionGranted: () => void;
}

export function CameraPermission({
  surveyTitle,
  onPermissionGranted,
}: CameraPermissionProps) {
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      // Stop the stream immediately - we just wanted to get permission
      stream.getTracks().forEach((track) => track.stop());
      onPermissionGranted();
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError(
            "Camera access was denied. Please allow camera access to continue."
          );
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError("Failed to access camera. Please try again.");
        }
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          {surveyTitle && (
            <p className="text-sm text-muted-foreground mb-2">
              Survey: {surveyTitle}
            </p>
          )}
          <CardTitle className="text-2xl">Camera Access Required</CardTitle>
          <CardDescription>
            This survey requires camera access for face detection. Your video
            will be processed locally and no personal information will be
            stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Video Recording</p>
                <p className="text-sm text-muted-foreground">
                  Short video segments will be captured for each question.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Camera className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-sm">Face Detection</p>
                <p className="text-sm text-muted-foreground">
                  Real-time face detection ensures engagement and generates
                  visibility scores.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2 border-t border-border/50">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Recording Guidelines</p>
                <p className="text-sm text-muted-foreground">
                  Recommended: 30-60 seconds per question. Maximum file size:
                  100MB per video.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={requestPermission}
            disabled={isRequesting}
            className="w-full"
            size="lg"
          >
            {isRequesting ? "Requesting Access..." : "Allow Camera Access"}
          </Button>

          <Link
            href="/"
            className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel and return home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
