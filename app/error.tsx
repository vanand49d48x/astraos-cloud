"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-destructive/5 to-background" />

      <div className="relative z-10 text-center">
        <div className="inline-block mb-8">
          <Logo size="lg" />
        </div>

        <div className="mb-6">
          <span className="text-8xl font-bold text-destructive/20">500</span>
        </div>

        <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          An unexpected error occurred. Our team has been notified.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary text-black font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 border border-white/10 rounded-lg hover:bg-white/5 transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
