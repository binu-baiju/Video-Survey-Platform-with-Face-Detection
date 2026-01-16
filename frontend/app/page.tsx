import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Camera, Lock, Download, Plus, List } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">FaceSurvey</span>
          </div>
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <List className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content - Single centered section */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-4">
            Video Surveys with Face Detection
          </h1>
          <p className="text-muted-foreground mb-8">
            Collect authentic Yes/No responses with real-time face detection.
            Privacy-first — no personal information collected.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4" />
              <span>Face Detection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>Privacy-First</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/admin/create">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create Survey
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="outline" size="lg" className="bg-transparent">
                View Surveys
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border py-4">
        <p className="text-center text-muted-foreground text-xs">
          Video Survey Platform — No Personal Information Collected
        </p>
      </footer>
    </div>
  );
}
