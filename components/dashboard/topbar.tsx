"use client";

import { useSession } from "next-auth/react";
import { Bell, Search } from "lucide-react";

export function Topbar() {
  const { data: session } = useSession();

  return (
    <header className="h-14 border-b border-white/[0.06] bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground w-full"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-medium text-primary">
            {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
