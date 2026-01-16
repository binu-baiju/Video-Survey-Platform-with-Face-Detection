import { ThankYouClient } from "@/components/survey/thank-you-client"

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ submissionId?: string }>
}) {
  const { id } = await params
  const { submissionId } = await searchParams

  return (
    <div className="min-h-screen bg-background">
      <ThankYouClient surveyId={id} submissionId={submissionId} />
    </div>
  )
}
