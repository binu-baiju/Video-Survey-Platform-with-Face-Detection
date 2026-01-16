"use client"

import { RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Check, X, User, AlertCircle, Video } from "lucide-react"
import { FaceDetectionResult } from "@/lib/faceDetection"

interface SurveyQuestionProps {
  videoRef: RefObject<HTMLVideoElement>
  questionNumber: number
  totalQuestions: number
  question: string
  faceDetectionResult: FaceDetectionResult | null
  onAnswer: (answer: "yes" | "no") => void
  isSubmitting: boolean
  recordingDuration?: number // Duration in seconds
}

export function SurveyQuestion({
  videoRef,
  questionNumber,
  totalQuestions,
  question,
  faceDetectionResult,
  onAnswer,
  isSubmitting,
  recordingDuration = 0,
}: SurveyQuestionProps) {
  const progress = (questionNumber / totalQuestions) * 100
  const faceDetected = faceDetectionResult?.detected || false
  const faceScore = faceDetectionResult?.score || 0
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }
  
  const isLongRecording = recordingDuration > 120 // Warn after 2 minutes

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with progress */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              <span className="font-semibold">FaceSurvey</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 sm:gap-8">
        {/* Video feed */}
        <div className="w-full lg:w-1/2 space-y-3 sm:space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-muted">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Face detection overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {faceDetectionResult && (
                  <div
                    className={`absolute inset-4 border-2 rounded-lg transition-colors ${
                      faceDetected ? "border-emerald-500" : "border-amber-500"
                    }`}
                  />
                )}
              </div>

              {/* Recording indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-full">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">
                  Recording {recordingDuration > 0 && `• ${formatDuration(recordingDuration)}`}
                </span>
              </div>
              
              {/* Duration warning */}
              {isLongRecording && (
                <div className="absolute top-12 sm:top-16 left-2 right-2 sm:left-4 sm:right-4 bg-amber-500/90 text-white p-2 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                  <span className="text-[10px] sm:text-xs">Long recording detected. Recommended: 30-60 seconds per question.</span>
                </div>
              )}

              {/* Face detection error */}
              {faceDetectionResult && !faceDetected && faceDetectionResult.error && (
                <div className="absolute bottom-4 left-4 right-4 bg-amber-500/90 text-white p-2 rounded-lg text-sm">
                  {faceDetectionResult.error}
                </div>
              )}
            </div>
          </Card>

          {/* Face detection status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      faceDetected ? "bg-emerald-500/10" : "bg-amber-500/10"
                    }`}
                  >
                    {faceDetected ? (
                      <User className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {faceDetected ? "Face Detected" : faceDetectionResult?.error || "No Face Detected"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {faceDetected
                        ? "You're visible in frame"
                        : "Please position your face in the camera"}
                    </p>
                  </div>
                </div>
                {faceDetected && faceScore > 0 && (
                  <div className="text-left sm:text-right">
                    <p className="text-xl sm:text-2xl font-bold text-emerald-500">{faceScore}%</p>
                    <p className="text-xs text-muted-foreground">Visibility Score</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question and answers */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <span className="text-xs sm:text-sm text-muted-foreground mb-2 block">Question {questionNumber}</span>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-balance break-words">{question}</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                className="flex-1 h-14 sm:h-16 text-base sm:text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onAnswer("yes")}
                disabled={isSubmitting || !faceDetected}
              >
                <Check className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Yes
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-14 sm:h-16 text-base sm:text-lg border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
                onClick={() => onAnswer("no")}
                disabled={isSubmitting || !faceDetected}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                No
              </Button>
            </div>

            {!faceDetected && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">For best results, please ensure your face is visible in the camera.</p>
              </div>
            )}

            {isSubmitting && (
              <div className="text-center text-sm text-muted-foreground">
                Submitting answer...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
