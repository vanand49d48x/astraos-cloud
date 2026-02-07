import { cn } from "@/lib/utils";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  linked?: boolean;
}

const sizeMap = {
  sm: { icon: "h-6 w-6", text: "text-base" },
  md: { icon: "h-8 w-8", text: "text-xl" },
  lg: { icon: "h-10 w-10", text: "text-2xl" },
};

export function Logo({ className, size = "md", showText = true, linked = true }: LogoProps) {
  const s = sizeMap[size];
  const content = (
    <span className={cn("flex items-center gap-2.5 group", className)}>
      <span className={cn("relative block", s.icon)}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Outer orbit ring */}
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="url(#logo-gradient)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className="opacity-60 group-hover:opacity-100 transition-opacity"
          />
          {/* Inner globe */}
          <circle cx="16" cy="16" r="8" fill="url(#globe-gradient)" />
          {/* Horizontal line across globe */}
          <ellipse cx="16" cy="16" rx="8" ry="3" stroke="#06060b" strokeWidth="0.8" opacity="0.4" />
          {/* Vertical arc */}
          <ellipse cx="16" cy="16" rx="3" ry="8" stroke="#06060b" strokeWidth="0.8" opacity="0.4" />
          {/* Satellite dot */}
          <circle cx="26" cy="8" r="2" fill="#00d4ff">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Satellite trail */}
          <path d="M24 9.5 Q20 14 16 16" stroke="#00d4ff" strokeWidth="0.5" opacity="0.3" fill="none" />
          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
              <stop stopColor="#00d4ff" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
            <radialGradient id="globe-gradient" cx="0.35" cy="0.35" r="0.65">
              <stop stopColor="#00d4ff" />
              <stop offset="0.7" stopColor="#0066cc" />
              <stop offset="1" stopColor="#1a1a4e" />
            </radialGradient>
          </defs>
        </svg>
      </span>
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
          ASTRA<span className="text-primary"> OS</span>
        </span>
      )}
    </span>
  );

  if (linked) {
    return <Link href="/">{content}</Link>;
  }
  return content;
}
