"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Key,
  Search,
  Layers,
  Image,
  Cpu,
  Database,
  Code,
} from "lucide-react";

const sidebarLinks = [
  {
    title: "Getting Started",
    href: "/docs",
    icon: BookOpen,
  },
  {
    title: "Authentication",
    href: "/docs/authentication",
    icon: Key,
  },
  {
    title: "Unified Search",
    href: "/docs/search",
    icon: Search,
  },
  {
    title: "Scene Details",
    href: "/docs/scenes",
    icon: Layers,
  },
  {
    title: "Asset Resolver",
    href: "/docs/assets",
    icon: Image,
  },
  {
    title: "Processing",
    href: "/docs/processing",
    icon: Cpu,
  },
  {
    title: "Data Sources",
    href: "/docs/data-sources",
    icon: Database,
  },
  {
    title: "SDKs",
    href: "/docs/sdks",
    icon: Code,
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-card sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block">
        <nav className="p-4 space-y-1">
          <div className="px-3 py-2 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documentation
            </h2>
          </div>
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/docs" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.title}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <MobileNav pathname={pathname} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-6 py-12 lg:px-12">
          {children}
        </div>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <details className="group relative">
      <summary className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg cursor-pointer list-none">
        <BookOpen className="h-5 w-5" />
      </summary>
      <div className="absolute bottom-14 right-0 w-56 rounded-xl bg-card border border-white/[0.06] shadow-2xl p-2 space-y-1 animate-slide-up">
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/docs" && pathname.startsWith(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {link.title}
            </Link>
          );
        })}
      </div>
    </details>
  );
}
