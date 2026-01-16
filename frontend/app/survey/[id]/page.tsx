import { SurveyPageClient } from "@/components/survey/survey-page-client";

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <SurveyPageClient surveyId={id} />
    </div>
  );
}
