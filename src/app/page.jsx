import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  SplitSquareVertical,
  Sparkles,
  Users,
  Receipt,
  TrendingUp,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-xl font-bold text-primary">
          <SplitSquareVertical className="h-6 w-6" />
          SplitSmart
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
          <Sparkles className="h-4 w-4" /> Powered by Google Gemini AI
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight md:text-6xl">
          Split Expenses.
          <br />
          <span className="text-primary">Smartly.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Stop the awkward money conversations. SplitSmart automatically tracks
          who paid, who owes, and uses AI to give you spending insights.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="px-8 text-lg">
              Start for Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-8 text-lg">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Group Management",
              desc: "Create groups, add members, track shared expenses together",
            },
            {
              icon: Receipt,
              title: "Smart Splitting",
              desc: "Equal or custom splits with automatic balance calculation",
            },
            {
              icon: TrendingUp,
              title: "AI Insights",
              desc: "Gemini AI categorizes expenses and reveals spending patterns",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border bg-white p-6 text-left shadow-sm"
            >
              <Icon className="mb-3 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
