"use client";

import Navbar from "@/components/shared/Navbar";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function DashboardLayout({ children }) {
  const { loading } = useAuth();

  if (loading)
    return <LoadingSpinner size="lg" label="Loading your workspace" />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#f3f7ff_100%)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
