"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Building2, Check } from "lucide-react";

// ── Step definitions ──────────────────────────────────────────────────────────

const DEV_USE_CASES = [
  { id: "climate", label: "Climate tech / carbon" },
  { id: "agriculture", label: "Agriculture & crop monitoring" },
  { id: "research", label: "Academic / research" },
  { id: "finance", label: "Finance & risk modeling" },
  { id: "other", label: "Something else" },
];

const BIZ_USE_CASES = [
  { id: "agriculture", label: "Agriculture & food security" },
  { id: "insurance", label: "Insurance & risk assessment" },
  { id: "realestate", label: "Real estate & land management" },
  { id: "government", label: "Government & public sector" },
  { id: "other", label: "Something else" },
];

const STEPS = ["role", "usecase", "team", "done"] as const;
type Step = (typeof STEPS)[number];

// ── Animation variants ────────────────────────────────────────────────────────
const slide = {
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [userType, setUserType] = useState<"developer" | "business" | null>(null);
  const [useCase, setUseCase] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  const useCases = userType === "developer" ? DEV_USE_CASES : BIZ_USE_CASES;
  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  async function finish() {
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType, useCase, teamName: teamName.trim() || undefined }),
      });
      setStep("done");
      // Small delay so user sees the done screen, then redirect
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-background to-background" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>

        {/* Progress bar */}
        {step !== "done" && (
          <div className="mb-8">
            <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "25%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right">
              Step {stepIndex + 1} of {STEPS.length - 1}
            </p>
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          {/* ── Step 1: Role ── */}
          {step === "role" && (
            <motion.div key="role" {...slide} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-bold text-center mb-2">Welcome to ASTRA OS</h1>
              <p className="text-muted-foreground text-center mb-8">
                How will you use ASTRA OS?
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    type: "developer" as const,
                    icon: Code2,
                    title: "Developer",
                    desc: "I'm building apps or pipelines with the API",
                  },
                  {
                    type: "business" as const,
                    icon: Building2,
                    title: "Business",
                    desc: "My team needs satellite intelligence for decisions",
                  },
                ].map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => {
                      setUserType(opt.type);
                      setStep("usecase");
                    }}
                    className={`group flex flex-col items-center gap-4 rounded-2xl border p-6 text-left transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
                      userType === opt.type
                        ? "border-primary bg-primary/10"
                        : "border-white/[0.08] bg-card"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <opt.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold mb-1">{opt.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Use case ── */}
          {step === "usecase" && (
            <motion.div key="usecase" {...slide} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-bold text-center mb-2">
                {userType === "developer" ? "What are you building?" : "What's your industry?"}
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                We'll tailor your dashboard to what matters most.
              </p>

              <div className="space-y-2">
                {useCases.map((uc) => (
                  <button
                    key={uc.id}
                    onClick={() => setUseCase(uc.id)}
                    className={`w-full flex items-center justify-between rounded-xl border px-4 py-3.5 text-sm font-medium transition-all cursor-pointer ${
                      useCase === uc.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-white/[0.07] bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {uc.label}
                    {useCase === uc.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setStep("role")} className="flex-1">
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!useCase}
                  onClick={() => setStep("team")}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Team name ── */}
          {step === "team" && (
            <motion.div key="team" {...slide} transition={{ duration: 0.3 }}>
              <h1 className="text-2xl font-bold text-center mb-2">Name your workspace</h1>
              <p className="text-muted-foreground text-center mb-8">
                This is how your team will appear in ASTRA OS.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Workspace name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={userType === "business" ? "Acme Corp" : "My Project"}
                    autoFocus
                    className="w-full rounded-xl border border-white/[0.08] bg-card px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all placeholder:text-muted-foreground/40"
                    onKeyDown={(e) => e.key === "Enter" && finish()}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    You can change this anytime in Settings.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setStep("usecase")} className="flex-1">
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={finish}
                  disabled={saving}
                >
                  {saving ? "Setting up..." : "Go to dashboard"}
                  {!saving && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-8"
            >
              <motion.div
                className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              >
                <Check className="w-8 h-8 text-primary" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">You're all set</h1>
              <p className="text-muted-foreground">
                Taking you to your{" "}
                {userType === "business" ? "business" : "developer"} dashboard…
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
