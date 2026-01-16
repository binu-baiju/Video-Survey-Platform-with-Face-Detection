"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Video, ArrowLeft, GripVertical, Save } from "lucide-react";
import { surveyApi } from "@/lib/api";

interface QuestionInput {
  id: string;
  text: string;
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuestion = (id: string, text: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, text } : q)));
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!title.trim()) {
      newErrors.push("Survey title is required");
    }

    if (questions.length !== 5) {
      newErrors.push("Exactly 5 questions are required");
    }

    const emptyQuestions = questions.filter((q) => !q.text.trim());
    if (emptyQuestions.length > 0) {
      newErrors.push(`${emptyQuestions.length} question(s) are empty`);
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Create survey via backend API
      const survey = await surveyApi.create(title.trim());

      // Add exactly 5 questions (assignment requirement)
      for (let i = 0; i < questions.length; i++) {
        await surveyApi.addQuestion(survey.id, questions[i].text.trim(), i + 1);
      }

      // Publish if requested
      if (isPublished) {
        await surveyApi.publish(survey.id, true);
      }

      // Redirect to admin page
      router.push(`/admin`);
    } catch (error: any) {
      console.error("Failed to create survey:", error);
      setErrors([
        error.response?.data?.detail ||
          error.message ||
          "Failed to create survey. Please try again.",
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Create New Survey
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Add your survey details and exactly 5 Yes/No questions
          </p>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <ul className="list-disc list-inside text-destructive text-sm space-y-1">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Survey Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
            <CardDescription>
              Basic information about your survey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title *</Label>
              <Input
                id="title"
                placeholder="Enter survey title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what this survey is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="published">Publish Survey</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Make this survey available to respondents
                </p>
              </div>
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={isSubmitting}
                className="self-start sm:self-auto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card className="mb-6">
          <CardHeader>
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Exactly 5 Yes/No questions required (assignment requirement)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="flex items-start gap-2 sm:gap-3"
              >
                <div className="flex items-center justify-center w-5 h-10 sm:w-6 text-muted-foreground shrink-0">
                  <GripVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                      Question {index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                      Yes/No
                    </span>
                  </div>
                  <Input
                    placeholder="Enter your question..."
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(question.id, e.target.value)
                    }
                    disabled={isSubmitting}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
          <Link href="/admin" className="w-full sm:w-auto">
            <Button
              variant="outline"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Survey"}
          </Button>
        </div>
      </main>
    </div>
  );
}
