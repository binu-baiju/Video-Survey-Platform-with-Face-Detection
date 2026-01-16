"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Video, Home, Loader2 } from "lucide-react"
import { surveyApi } from "@/lib/api"
import { SurveyClient } from "./survey-client"

interface SurveyPageClientProps {
  surveyId: string
}

export function SurveyPageClient({ surveyId }: SurveyPageClientProps) {
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  const loadSurvey = async () => {
    try {
      setLoading(true)
      setError(null)

      const surveyData = await surveyApi.get(parseInt(surveyId))

      if (!surveyData.is_active) {
        setError("This survey is not published yet")
        return
      }

      if (surveyData.questions.length !== 5) {
        setError("Survey must have exactly 5 questions")
        return
      }

      setSurvey(surveyData)
    } catch (err: any) {
      console.error("Failed to load survey:", err)
      setError(err.response?.data?.detail || "Survey not found")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    )
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">FaceSurvey</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <Card className="text-center py-12 max-w-md mx-4">
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">{error || "Survey Not Found"}</h3>
              <p className="text-muted-foreground mb-4">
                The survey you are looking for does not exist or is not available.
              </p>
              <Link href="/">
                <Button>
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <SurveyClient
      surveyId={survey.id}
      surveyTitle={survey.title}
      questions={survey.questions}
    />
  )
}
