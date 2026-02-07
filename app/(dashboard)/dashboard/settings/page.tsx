"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Bell, Shield, Save } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [teamName, setTeamName] = useState("My Team");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // In production, this would call an API to update the user profile
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and team settings
        </p>
      </div>

      {/* Profile */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Profile</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <p className="text-sm text-muted-foreground bg-white/5 border border-white/10 rounded-lg px-4 py-2.5">
              {session?.user?.email || "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>

          <Button type="submit" size="sm" loading={saving}>
            {saved ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>

      {/* Team */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Team</h3>
          <Badge variant="outline" className="text-xs">
            Owner
          </Badge>
        </div>

        <div className="space-y-4">
          <Input
            label="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Your team name"
          />

          <div>
            <label className="text-sm font-medium mb-1.5 block">Members</label>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                    {session?.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm">{session?.user?.name || "You"}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </div>
                <Badge variant="primary" className="text-xs">Owner</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Team member management available on Pro and Enterprise plans
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          {[
            { label: "Usage alerts", description: "When you reach 80% and 100% of your plan limits" },
            { label: "API key activity", description: "When a new key is created or revoked" },
            { label: "Product updates", description: "New features and improvements" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer-checked:bg-primary/60 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Security</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Active sessions</p>
              <p className="text-xs text-muted-foreground">
                Manage your active login sessions
              </p>
            </div>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
