"use client";

import { useState, useEffect } from "react";
import { surveyApi, Survey } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, Home, RefreshCw, Eye, ExternalLink, Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [newSurveyTitle, setNewSurveyTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loadingSurveys, setLoadingSurveys] = useState(true);

  // Load all surveys on page load
  useEffect(() => {
    loadAllSurveys();
  }, []);

  const loadAllSurveys = async () => {
    try {
      setLoadingSurveys(true);
      const loadedSurveys = await surveyApi.list();
      setSurveys(loadedSurveys);
    } catch (error: any) {
      console.error("Failed to load surveys:", error);
      setMessage("Failed to load surveys");
    } finally {
      setLoadingSurveys(false);
    }
  };

  const createSurvey = async () => {
    if (!newSurveyTitle.trim()) {
      setMessage("Please enter a survey title");
      return;
    }

    setLoading(true);
    try {
      const survey = await surveyApi.create(newSurveyTitle);
      setSurveys([...surveys, survey]);
      setNewSurveyTitle("");
      setMessage("Survey created successfully!");
    } catch (error: any) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const publishSurvey = async (surveyId: number) => {
    setLoading(true);
    try {
      const updatedSurvey = await surveyApi.publish(surveyId, true);
      setSurveys(
        surveys.map((s) => (s.id === updatedSurvey.id ? updatedSurvey : s))
      );
      setMessage("Survey published successfully!");
    } catch (error: any) {
      setMessage(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link href="/admin/create">
              <Button size="sm" className="text-xs sm:text-sm">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Create Survey</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your surveys and view responses
          </p>
        </div>

        {message && (
          <Card
            className={`mb-6 ${
              message.includes("Error")
                ? "border-destructive"
                : "border-emerald-500"
            }`}
          >
            <CardContent className="pt-6">
              <p
                className={
                  message.includes("Error")
                    ? "text-destructive"
                    : "text-emerald-600"
                }
              >
                {message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Create Survey */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Survey</CardTitle>
            <CardDescription>Start a new video survey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                type="text"
                value={newSurveyTitle}
                onChange={(e) => setNewSurveyTitle(e.target.value)}
                placeholder="Survey Title"
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={createSurvey}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Surveys List */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Surveys</CardTitle>
              <CardDescription>
                View and manage all your surveys
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllSurveys}
              disabled={loadingSurveys}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${
                  loadingSurveys ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
                  {loadingSurveys ? (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <p className="text-muted-foreground">Loading surveys...</p>
                    </div>
                  ) : surveys.length === 0 ? (
              <p className="text-muted-foreground">No surveys created yet.</p>
            ) : (
              <div className="space-y-2">
                {surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="p-3 sm:p-4 border border-border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => {
                      router.push(`/admin/survey/${survey.id}`);
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {survey.title}
                          </h3>
                          <Badge
                            variant={survey.is_active ? "default" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {survey.is_active ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {survey.questions.length} questions
                        </p>
                      </div>
                      <div
                        className="flex gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!survey.is_active && survey.questions.length === 5 && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              publishSurvey(survey.id);
                            }}
                            disabled={loading}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Publish</span>
                          </Button>
                        )}
                        {survey.is_active && (
                          <Link href={`/survey/${survey.id}`} target="_blank">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                              <span className="hidden sm:inline">
                                View Survey
                              </span>
                              <span className="sm:hidden">View</span>
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <p className="text-center text-muted-foreground text-xs">
          Video Survey Platform — Admin Dashboard
        </p>
      </footer>
    </div>
  );
}
