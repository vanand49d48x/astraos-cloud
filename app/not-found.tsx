import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      <div className="relative z-10 text-center">
        <div className="inline-block mb-8">
          <Logo size="lg" />
        </div>

        <div className="mb-6">
          <span className="text-8xl font-bold text-primary/20">404</span>
        </div>

        <h1 className="text-2xl font-bold mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-2.5 bg-primary text-black font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/docs"
            className="px-6 py-2.5 border border-white/10 rounded-lg hover:bg-white/5 transition-all"
          >
            View Docs
          </Link>
        </div>
      </div>
    </div>
  );
}
