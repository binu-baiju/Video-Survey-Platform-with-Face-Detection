"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Download,
  Home,
  Video,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { submissionApi, surveyApi } from "@/lib/api";

interface ThankYouClientProps {
  surveyId: string;
  submissionId?: string;
}

export function ThankYouClient({
  surveyId,
  submissionId: initialSubmissionId,
}: ThankYouClientProps) {
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [survey, setSurvey] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [surveyId, initialSubmissionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get submission ID from URL query if not provided
      let submissionId = initialSubmissionId;
      if (!submissionId) {
        const urlParams = new URLSearchParams(window.location.search);
        submissionId = urlParams.get("submissionId") || undefined;
      }

      if (!submissionId) {
        setError("No submission ID provided");
        setLoading(false);
        return;
      }

      // Load survey
      const surveyData = await surveyApi.get(parseInt(surveyId));
      setSurvey(surveyData);

      // Load submission data from backend API
      const data = await submissionApi.get(parseInt(submissionId));
      setSubmissionData(data);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError(err.response?.data?.detail || "Failed to load submission data");
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async () => {
    if (!submissionData?.id || isDownloading) return;
    setIsDownloading(true);

    try {
      const blob = await submissionApi.export(submissionData.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submission_${submissionData.id}_export.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert("Failed to download export: " + (err.message || "Unknown error"));
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !submissionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">
            {error || "Submission not found"}
          </div>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const answers = submissionData.answers || [];
  const averageScore = answers.length
    ? Math.round(
        answers.reduce((sum: number, a: any) => sum + (a.face_score || 0), 0) /
          answers.length
      )
    : 0;
  const yesCount = answers.filter((a: any) => a.answer === "Yes").length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">FaceSurvey</span>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm" className="bg-transparent">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Thank You!</h1>
            <p className="text-muted-foreground text-lg">
              Your survey responses have been recorded successfully.
            </p>
            {survey && (
              <p className="text-sm text-muted-foreground mt-2">
                Survey: {survey.title}
              </p>
            )}
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {answers.length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Questions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-500">
                  {averageScore}%
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Avg Visibility Score
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">
                  {yesCount}/{answers.length}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Yes Answers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Download section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Your Data
              </CardTitle>
              <CardDescription>Export your survey responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={downloadExport}
                disabled={isDownloading}
                className="w-full"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating ZIP...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Export (ZIP)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Summary section */}
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setShowSummary(!showSummary)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && setShowSummary(!showSummary)
              }
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Response Summary</CardTitle>
                {showSummary ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {showSummary && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {answers.map((answer: any, index: number) => (
                    <div
                      key={answer.id}
                      className="border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                            Question {answer.question_order}
                          </p>
                          <p className="font-medium text-xs sm:text-sm break-words">
                            {answer.question_text}
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              answer.answer === "Yes"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {answer.answer.toUpperCase()}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            Visibility:{" "}
                            {answer.face_score !== null
                              ? `${answer.face_score}%`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      {answer.face_image_path && (
                        <div className="mt-3">
                          <img
                            src={`${
                              process.env.NEXT_PUBLIC_API_URL ||
                              (typeof window !== "undefined"
                                ? window.location.origin.replace(
                                    ":3000",
                                    ":8000"
                                  )
                                : "http://localhost:8000")
                            }${answer.face_image_path}`}
                            alt={`Snapshot for question ${answer.question_order}`}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border border-border"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {answers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No responses recorded.
                    </p>
                  )}
                </div>

                {/* Metadata */}
                {submissionData && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      System Metadata (Collected)
                    </p>
                    <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1 text-muted-foreground">
                      <p>Submission ID: {submissionData.id}</p>
                      <p>Questions Answered: {answers.length}</p>
                      <p>Average Visibility: {averageScore}%</p>
                      <p>Device: {submissionData.device || "N/A"}</p>
                      <p>Browser: {submissionData.browser || "N/A"}</p>
                      <p>OS: {submissionData.os || "N/A"}</p>
                      <p>Location: {submissionData.location || "N/A"}</p>
                      <p>
                        Completed:{" "}
                        {submissionData.completed_at
                          ? new Date(
                              submissionData.completed_at
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent"
              >
                View All Surveys
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>
            Your privacy is protected - No personal identity information was
            collected.
          </p>
        </div>
      </footer>
    </div>
  );
}
