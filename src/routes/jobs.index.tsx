import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categories, employmentLabels, fetchJobs, type EmploymentType } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs/")({
  validateSearch: z.object({
    q: z.string().optional(),
    loc: z.string().optional(),
    cat: z.string().optional(),
  }),
  head: () => ({
    meta: [
      { title: "Browse music industry jobs | Musicosy" },
      {
        name: "description",
        content:
          "Search open roles across studios, labels, touring companies and audio software teams. Filter by craft, location, contract type and pay.",
      },
      { property: "og:title", content: "Browse music industry jobs | Musicosy" },
      {
        property: "og:description",
        content: "Studio, live, label and audio engineering roles updated daily on Musicosy.",
      },
    ],
  }),
  component: JobsPage,
});

const types: EmploymentType[] = ["full_time", "part_time", "contract", "freelance", "internship"];

function JobsPage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [q, setQ] = useState(search.q ?? "");
  const [loc, setLoc] = useState(search.loc ?? "");
  const [cat, setCat] = useState<string | null>(search.cat ?? null);
  const [type, setType] = useState<EmploymentType | null>(null);

  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });

  const { data: saved = [] } = useQuery({
    queryKey: ["saved-jobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_jobs").select("job_id");
      if (error) throw error;
      return data.map((r) => r.job_id);
    },
  });

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const place = loc.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesTerm =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.category.toLowerCase().includes(term) ||
        (job.companies?.name ?? "").toLowerCase().includes(term) ||
        job.tags.some((t) => t.toLowerCase().includes(term));
      const matchesPlace =
        !place ||
        job.location.toLowerCase().includes(place) ||
        (place.includes("remote") && job.is_remote);
      return matchesTerm && matchesPlace && (!cat || job.category === cat) && (!type || job.employment_type === type);
    });
  }, [jobs, q, loc, cat, type]);

  async function toggleSave(jobId: string) {
    if (!user) {
      toast.error("Sign in to bookmark roles.");
      return;
    }
    if (saved.includes(jobId)) {
      await supabase.from("saved_jobs").delete().eq("job_id", jobId).eq("user_id", user.id);
    } else {
      await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: user.id });
    }
    void queryClient.invalidateQueries({ queryKey: ["saved-jobs", user.id] });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-canvas py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Open roles across the <span className="text-primary">music industry</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoading ? "Loading roles…" : `${results.length} roles matching your filters`}
          </p>

          <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-card p-3 shadow-[var(--shadow-card)] md:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Role, company or skill"
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 border-border px-3 md:border-l">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <Input
                value={loc}
                onChange={(e) => setLoc(e.target.value)}
                placeholder="Location"
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-8">
          <div>
            <p className="font-display text-sm font-semibold">Category</p>
            <div className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:items-start">
              <FilterChip active={!cat} onClick={() => setCat(null)} label="All categories" />
              {categories.map((c) => (
                <FilterChip key={c} active={cat === c} onClick={() => setCat(c)} label={c} />
              ))}
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-semibold">Contract</p>
            <div className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:items-start">
              <FilterChip active={!type} onClick={() => setType(null)} label="Any" />
              {types.map((t) => (
                <FilterChip
                  key={t}
                  active={type === t}
                  onClick={() => setType(t)}
                  label={employmentLabels[t]}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          {results.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              saved={saved.includes(job.id)}
              onToggleSave={(j) => void toggleSave(j.id)}
            />
          ))}
          {!isLoading && results.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center">
              <p className="font-display text-lg font-semibold">No roles match that search</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a broader keyword, or clear your filters.
              </p>
              <Button
                variant="softOutline"
                className="mt-5"
                onClick={() => {
                  setQ("");
                  setLoc("");
                  setCat(null);
                  setType(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
          {!user && (
            <p className="pt-4 text-center text-sm text-muted-foreground">
              <Link to="/auth" search={{ mode: "up" }} className="font-semibold text-primary hover:underline">
                Create a free account
              </Link>{" "}
              to apply and save roles.
            </p>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
