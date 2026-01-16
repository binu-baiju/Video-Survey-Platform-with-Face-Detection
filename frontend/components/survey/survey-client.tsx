"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { CameraPermission } from "./camera-permission";
import { SurveyQuestion } from "./survey-question";
import { useRouter } from "next/navigation";
import { submissionApi } from "@/lib/api";
import { FaceDetector, FaceDetectionResult } from "@/lib/faceDetection";
import { VideoRecorder } from "@/lib/videoRecorder";

interface SurveyClientProps {
  surveyId: number;
  surveyTitle: string;
  questions: Array<{ id: number; question_text: string; order: number }>;
}

export function SurveyClient({
  surveyId,
  surveyTitle,
  questions,
}: SurveyClientProps) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [faceDetectionResult, setFaceDetectionResult] =
    useState<FaceDetectionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faceScores, setFaceScores] = useState<Map<number, number>>(new Map());
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const fullSessionRecorderRef = useRef<VideoRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start submission when permission is granted
  useEffect(() => {
    if (hasPermission && !submissionId) {
      startSubmission();
    }
  }, [hasPermission]);

  // Initialize camera and face detection
  useEffect(() => {
    if (
      hasPermission &&
      submissionId &&
      videoRef.current &&
      !faceDetectorRef.current
    ) {
      const timer = setTimeout(() => {
        initializeCamera();
      }, 100);

      return () => {
        clearTimeout(timer);
        cleanup();
      };
    }
    return () => {
      cleanup();
    };
  }, [hasPermission, submissionId]);

  const cleanup = async () => {
    if (faceDetectorRef.current) {
      await faceDetectorRef.current.stop();
      faceDetectorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startSubmission = async () => {
    try {
      const submission = await submissionApi.start(surveyId);
      setSubmissionId(submission.submission_id);
    } catch (err: any) {
      console.error("Failed to start submission:", err);
      alert(
        "Failed to start survey: " + (err.response?.data?.detail || err.message)
      );
    }
  };

  const initializeCamera = async () => {
    try {
      if (!videoRef.current || !submissionId) return;

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current) return;

          try {
            await videoRef.current.play();

            // Initialize face detection
            const detector = new FaceDetector();
            await detector.initialize(videoRef.current);
            detector.onResults((result) => {
              setFaceDetectionResult(result);
            });
            faceDetectorRef.current = detector;

            // Start full session recording (only one video required by assignment)
            const fullRecorder = new VideoRecorder();
            await fullRecorder.start(stream);
            fullSessionRecorderRef.current = fullRecorder;

            // Start recording duration timer
            startRecordingTimer();
          } catch (err: any) {
            console.error("Camera initialization error:", err);
          }
        };
      }
    } catch (err: any) {
      console.error("Failed to access camera:", err);
      alert("Failed to access camera: " + (err.message || "Unknown error"));
    }
  };

  const startRecordingTimer = () => {
    recordingStartTimeRef.current = Date.now();
    setRecordingDuration(0);

    // Clear existing interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Update duration every second
    durationIntervalRef.current = setInterval(() => {
      if (recordingStartTimeRef.current) {
        const elapsed = Math.floor(
          (Date.now() - recordingStartTimeRef.current) / 1000
        );
        setRecordingDuration(elapsed);
      }
    }, 1000);
  };

  const handlePermissionGranted = useCallback(() => {
    setHasPermission(true);
  }, []);

  const handleAnswer = useCallback(
    async (answer: "yes" | "no") => {
      if (!submissionId || !faceDetectionResult || isSubmitting) return;

      setIsSubmitting(true);

      try {
        const question = questions[currentQuestion];
        const faceScore = faceDetectionResult.detected
          ? faceDetectionResult.score
          : null;

        // Capture image first (parallel with answer submission for speed)
        const imageCapturePromise = faceDetectorRef.current && faceDetectionResult.detected
          ? faceDetectorRef.current.captureImage()
          : Promise.resolve(null);

        // Submit answer first (must complete before image upload to set face_image_path)
        await submissionApi.submitAnswer(submissionId, {
          question_id: question.id,
          answer: answer === "yes" ? "Yes" : "No",
          face_detected: faceDetectionResult.detected,
          face_score: faceScore,
        });

        // Upload image - await to ensure path is saved (images are small, fast to upload)
        const imageBlob = await imageCapturePromise;
        if (imageBlob && faceDetectionResult.detected) {
          try {
            const imageFile = new File(
              [imageBlob],
              `q${question.order}_face.png`,
              {
                type: "image/png",
              }
            );
            // Await image upload to ensure face_image_path is set in database
            await submissionApi.uploadMedia(
              submissionId,
              imageFile,
              "image",
              question.order
            );
          } catch (err) {
            console.error("Failed to upload image:", err);
            // Don't fail the whole submission if image upload fails
          }
        }

        // Store face score
        if (faceScore !== null) {
          setFaceScores(new Map(faceScores.set(question.id, faceScore)));
        }

        // Move to next question or complete
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1);
        } else {
          // Complete submission
          await completeSubmission();
        }
      } catch (err: any) {
        console.error("Failed to submit answer:", err);
        alert(
          "Failed to submit answer: " +
            (err.response?.data?.detail || err.message)
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      submissionId,
      currentQuestion,
      questions,
      faceDetectionResult,
      faceScores,
      isSubmitting,
    ]
  );

  const completeSubmission = async () => {
    if (!submissionId) return;

    try {
      // Stop full session recording
      if (fullSessionRecorderRef.current && streamRef.current) {
        const fullVideoBlob = await fullSessionRecorderRef.current.stop();
        const fullVideoFile = new File([fullVideoBlob], "full_session.webm", {
          type: "video/webm",
        });
        await submissionApi.uploadMedia(submissionId, fullVideoFile, "video");
      }

      // Calculate overall score
      const scores = Array.from(faceScores.values());
      const overallScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;

      // Complete submission
      await submissionApi.complete(submissionId, overallScore);

      // Redirect to thank you page
      router.push(`/survey/${surveyId}/thank-you?submissionId=${submissionId}`);
    } catch (err: any) {
      console.error("Failed to complete submission:", err);
      alert(
        "Failed to complete survey: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  if (!hasPermission) {
    return (
      <CameraPermission
        surveyTitle={surveyTitle}
        onPermissionGranted={handlePermissionGranted}
      />
    );
  }

  const currentQuestionData = questions[currentQuestion];
  if (!currentQuestionData) return null;

  return (
    <SurveyQuestion
      videoRef={videoRef}
      questionNumber={currentQuestion + 1}
      totalQuestions={questions.length}
      question={currentQuestionData.question_text}
      faceDetectionResult={faceDetectionResult}
      onAnswer={handleAnswer}
      isSubmitting={isSubmitting}
      recordingDuration={recordingDuration}
    />
  );
}
