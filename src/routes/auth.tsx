import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AudioLines, Briefcase, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type Workflow } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["in", "up"]).optional(),
    as: z.enum(["candidate", "employer"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Sign in or join Musicosy — music industry jobs" },
      {
        name: "description",
        content:
          "Create a Musicosy account as a candidate looking for music work, or as an employer hiring studio, live and label talent.",
      },
      { property: "og:title", content: "Sign in or join Musicosy" },
      {
        property: "og:description",
        content: "Two workflows, one platform: find music work or hire music people.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "up", as } = Route.useSearch();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [workflow, setWorkflow] = useState<Workflow>(as ?? "candidate");
  const [isSignUp, setIsSignUp] = useState(mode === "up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user && role) {
      void navigate({ to: role === "employer" ? "/employer" : "/candidate" });
    }
  }, [user, role, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role: workflow },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to Musicosy.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-ink p-12 text-ink-foreground lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <AudioLines className="size-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold">Musicosy</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Two doors.
            <br />
            <span className="text-primary">One industry.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm text-ink-foreground/60">
            Candidates get a hub for applications and bookmarks. Employers get a desk for companies,
            posts and applicants. Pick your side and we'll route you there every time you sign in.
          </p>
        </div>
        <p className="text-xs text-ink-foreground/40">Studios · Stages · Labels · Since 2026</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-bold">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Choose the workflow that fits you. You can browse jobs either way."
              : "Sign in to pick up where you left off."}
          </p>

          {isSignUp && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {(
                [
                  { key: "candidate", label: "I want work", icon: Briefcase },
                  { key: "employer", label: "I'm hiring", icon: Building2 },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setWorkflow(opt.key)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                    workflow === opt.key
                      ? "border-primary bg-accent"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <opt.icon
                    className={cn(
                      "size-5",
                      workflow === opt.key ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="font-display text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Rivera"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" variant="brand" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              {isSignUp ? "Create account" : "Sign in"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={() => void handleGoogle()}>
            Continue with Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "New to Musicosy?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => setIsSignUp((v) => !v)}
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
