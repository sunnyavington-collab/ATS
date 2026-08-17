import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Building2, CalendarDays, Globe, MapPin, Wallet } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { employmentLabels, fetchJob, formatSalary, timeAgo } from "@/lib/jobs";

export const Route = createFileRoute("/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Job details | Musicosy" },
      {
        name: "description",
        content:
          "Read the full brief, pay range and requirements for this music industry role, then apply on Musicosy in one step.",
      },
      { property: "og:title", content: "Job details | Musicosy" },
      {
        property: "og:description",
        content: "Full brief, pay range and requirements for this music industry role.",
      },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob(jobId),
  });

  const { data: existing } = useQuery({
    queryKey: ["application", jobId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,created_at")
        .eq("job_id", jobId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function apply() {
    if (!user) {
      void navigate({ to: "/auth", search: { mode: "up" } });
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("applications").insert({
      job_id: jobId,
      candidate_id: user.id,
      cover_note: note || null,
      portfolio_url: portfolio || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application sent.");
    void queryClient.invalidateQueries({ queryKey: ["application", jobId, user.id] });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Back to all jobs
        </Link>

        {isLoading && <p className="py-20 text-center text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && !job && (
          <p className="py-20 text-center text-sm text-muted-foreground">This role is no longer listed.</p>
        )}

        {job && (
          <>
            <header className="mt-6 rounded-4xl bg-ink p-8 text-ink-foreground">
              <div className="flex flex-wrap items-start gap-5">
                <div
                  className="flex size-14 items-center justify-center rounded-2xl font-display text-xl font-bold text-primary-foreground"
                  style={{ backgroundColor: job.companies?.brand_color ?? undefined }}
                  aria-hidden
                >
                  {(job.companies?.name ?? "M").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-foreground/60">{job.companies?.name}</p>
                  <h1 className="font-display text-3xl font-bold">{job.title}</h1>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-foreground/60">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="size-3.5" /> {formatSalary(job)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" /> Posted {timeAgo(job.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="size-3.5" /> {employmentLabels[job.employment_type]}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
              <article className="space-y-8">
                <section>
                  <h2 className="font-display text-xl font-semibold">About the role</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {job.description}
                  </p>
                </section>
                {job.requirements && (
                  <section>
                    <h2 className="font-display text-xl font-semibold">What we're looking for</h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {job.requirements}
                    </p>
                  </section>
                )}
                {job.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  {role === "employer" ? (
                    <p className="text-sm text-muted-foreground">
                      You're signed in on the employer workflow. Switch to a candidate account to
                      apply.
                    </p>
                  ) : existing ? (
                    <div>
                      <p className="font-display text-lg font-semibold">Application sent</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Status: <span className="font-medium text-foreground">{existing.status}</span>
                      </p>
                      <Button asChild variant="softOutline" className="mt-4 w-full">
                        <Link to="/candidate">View in my hub</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="font-display text-lg font-semibold">Apply for this role</p>
                      <div className="space-y-2">
                        <Label htmlFor="note">Short note</Label>
                        <Textarea
                          id="note"
                          rows={4}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Credits, availability, why this one."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio">Portfolio link</Label>
                        <Input
                          id="portfolio"
                          value={portfolio}
                          onChange={(e) => setPortfolio(e.target.value)}
                          placeholder="https://"
                        />
                      </div>
                      <Button
                        variant="brand"
                        className="w-full"
                        disabled={busy}
                        onClick={() => void apply()}
                      >
                        {user ? "Send application" : "Sign up to apply"}
                      </Button>
                    </div>
                  )}
                </div>

                {job.companies && (
                  <div className="rounded-3xl border border-border bg-card p-6">
                    <p className="font-display text-lg font-semibold">{job.companies.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{job.companies.tagline}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{job.companies.description}</p>
                    {job.companies.website && (
                      <a
                        href={job.companies.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        <Globe className="size-4" /> Visit website
                      </a>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
