"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Video,
  ArrowLeft,
  ExternalLink,
  Download,
  Trash2,
  Calendar,
  Monitor,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { surveyApi, submissionApi } from "@/lib/api";

export default function SurveyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = parseInt(params.id as string);
  const [survey, setSurvey] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [expandedResponses, setExpandedResponses] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load survey
      const surveyData = await surveyApi.get(surveyId);
      setSurvey(surveyData);

      // Load responses (submissions)
      const submissionsData = await submissionApi.getBySurvey(surveyId);
      setResponses(submissionsData.submissions || []);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError(err.response?.data?.detail || "Failed to load survey data");
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async () => {
    if (!survey) return;
    try {
      const updated = await surveyApi.publish(survey.id, !survey.is_active);
      setSurvey(updated);
    } catch (err: any) {
      console.error("Failed to update survey:", err);
      alert(
        "Failed to update survey: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  const handleDeleteResponse = async (responseId: number) => {
    try {
      await submissionApi.delete(responseId);
      setResponses(responses.filter((r) => r.id !== responseId));
    } catch (err: any) {
      console.error("Failed to delete response:", err);
      alert(
        "Failed to delete response: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  const handleDeleteSurvey = async () => {
    if (!survey) return;
    try {
      await surveyApi.delete(survey.id);
      router.push("/admin");
    } catch (err: any) {
      console.error("Failed to delete survey:", err);
      alert(
        "Failed to delete survey: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  const toggleExpanded = async (id: number) => {
    const newExpanded = new Set(expandedResponses);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Load full submission details if not already loaded
      const response = responses.find((r) => r.id === id);
      if (response && !response.answers) {
        try {
          const fullSubmission = await submissionApi.get(id);
          setResponses(
            responses.map((r) => (r.id === id ? fullSubmission : r))
          );
        } catch (err: any) {
          console.error("Failed to load submission details:", err);
        }
      }
    }
    setExpandedResponses(newExpanded);
  };

  const downloadAllResponses = () => {
    if (!survey) return;
    const data = {
      survey: {
        id: survey.id,
        title: survey.title,
        is_active: survey.is_active,
        questions: survey.questions,
      },
      responses: responses.map((r) => ({
        id: r.id,
        submission_id: r.submission_id,
        completed_at: r.completed_at,
        overall_score: r.overall_score,
        answers: r.answers,
        metadata: {
          ip_address: r.ip_address,
          device: r.device,
          browser: r.browser,
          os: r.os,
          location: r.location,
        },
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${survey.title
      .replace(/\s+/g, "-")
      .toLowerCase()}-responses.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Loading...</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Survey Not Found</h3>
            <p className="text-muted-foreground mb-4">
              {error || "The survey you are looking for does not exist."}
            </p>
            <Link href="/admin">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base sm:text-lg truncate">
              FaceSurvey
            </span>
          </Link>
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm shrink-0"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Survey Info */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <CardTitle className="text-xl sm:text-2xl truncate">
                    {survey.title}
                  </CardTitle>
                  <Badge
                    variant={survey.is_active ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
                    {survey.is_active ? "Published" : "Draft"}
                  </Badge>
                </div>
                {survey.description && (
                  <CardDescription className="text-sm">
                    {survey.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={togglePublish}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {survey.is_active ? "Unpublish" : "Publish"}
                  </span>
                  <span className="sm:hidden">
                    {survey.is_active ? "Unpub" : "Publish"}
                  </span>
                </Button>
                {survey.is_active && (
                  <Link href={`/survey/${survey.id}`} target="_blank">
                    <Button size="sm" className="text-xs sm:text-sm">
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Take Survey</span>
                      <span className="sm:hidden">Take</span>
                    </Button>
                  </Link>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Delete Survey</span>
                      <span className="sm:hidden">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this survey? This will
                        permanently delete the survey, all questions, all
                        responses, answers, and media files. This action cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteSurvey}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span>
                Created {new Date(survey.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                Questions ({survey.questions.length})
              </h4>
              <div className="space-y-2">
                {survey.questions.map((q: any, i: number) => (
                  <div key={q.id} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-xs font-medium">
                      {q.order}
                    </span>
                    <span>{q.question_text}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responses */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            Responses ({responses.length})
          </h2>
          {responses.length > 0 && (
            <Button
              variant="outline"
              onClick={downloadAllResponses}
              size="sm"
              className="text-xs sm:text-sm w-full sm:w-auto"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              Export All
            </Button>
          )}
        </div>

        {responses.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
              <p className="text-muted-foreground mb-4">
                {survey.is_active
                  ? "Share your survey link to start collecting responses."
                  : "Publish your survey to start collecting responses."}
              </p>
              {survey.is_active && (
                <div className="flex justify-center">
                  <Link href={`/survey/${survey.id}`} target="_blank">
                    <Button>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Take Survey
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {responses.map((response, index) => (
              <Card key={response.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => toggleExpanded(response.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Response #{index + 1}
                      </CardTitle>
                      <CardDescription>
                        {response.completed_at
                          ? `Completed ${new Date(
                              response.completed_at
                            ).toLocaleString()}`
                          : `Started ${new Date(
                              response.started_at
                            ).toLocaleString()}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Response</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this response?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteResponse(response.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      {expandedResponses.has(response.id) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {expandedResponses.has(response.id) && (
                  <CardContent>
                    {/* System Metadata */}
                    <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">
                          System Metadata
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                        <div>Device: {response.device || "N/A"}</div>
                        <div>Browser: {response.browser || "N/A"}</div>
                        <div>OS: {response.os || "N/A"}</div>
                        <div>Location: {response.location || "N/A"}</div>
                        <div>IP: {response.ip_address}</div>
                        <div>
                          Score:{" "}
                          {response.overall_score !== null
                            ? `${response.overall_score}%`
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* Answers */}
                    <div className="space-y-4">
                      {response.answers && response.answers.length > 0 ? (
                        response.answers.map((answer: any, i: number) => (
                          <div
                            key={answer.id}
                            className="border border-border rounded-lg p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Q{answer.question_order}
                              </span>
                              {answer.answer === "Yes" ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Yes
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  No
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm mb-2 break-words">
                              {answer.question_text}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                              <span>
                                Visibility Score:{" "}
                                {answer.face_score !== null
                                  ? `${answer.face_score}%`
                                  : "N/A"}
                              </span>
                              <span>
                                Face Visible:{" "}
                                {answer.face_detected ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {response.answers === undefined
                            ? "Loading answers..."
                            : "No answers found"}
                        </p>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
