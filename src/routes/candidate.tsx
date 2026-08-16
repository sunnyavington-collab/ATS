import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bookmark, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatSalary, timeAgo } from "@/lib/jobs";

export const Route = createFileRoute("/candidate")({
  head: () => ({
    meta: [
      { title: "Candidate hub | Musicosy" },
      {
        name: "description",
        content:
          "Track every music job application you've sent, check where each one stands and revisit the roles you bookmarked.",
      },
      { property: "og:title", content: "Candidate hub | Musicosy" },
      {
        property: "og:description",
        content: "Your applications and saved music industry roles in one place.",
      },
    ],
  }),
  component: CandidateHub,
});

type AppRow = {
  id: string;
  status: string;
  created_at: string;
  cover_note: string | null;
  jobs: {
    id: string;
    title: string;
    location: string;
    salary_min: number | null;
    salary_max: number | null;
    salary_period: string;
    companies: { name: string; brand_color: string } | null;
  } | null;
};

function CandidateHub() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { mode: "in" } });
  }, [loading, user, navigate]);

  const { data: applications = [] } = useQuery({
    queryKey: ["my-applications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select(
          "id,status,created_at,cover_note, jobs(id,title,location,salary_min,salary_max,salary_period, companies(name,brand_color))",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AppRow[];
    },
  });

  const { data: saved = [] } = useQuery({
    queryKey: ["saved-detail", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("id, jobs(id,title,location,companies(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        jobs: { id: string; title: string; location: string; companies: { name: string } | null } | null;
      }[];
    },
  });

  async function withdraw(id: string) {
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Application withdrawn.");
    void queryClient.invalidateQueries({ queryKey: ["my-applications", user?.id] });
  }

  const stats = [
    { label: "Applications sent", value: applications.length },
    {
      label: "In conversation",
      value: applications.filter((a) => ["reviewing", "interview", "offer"].includes(a.status)).length,
    },
    { label: "Saved roles", value: saved.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-canvas py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Candidate workflow
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your hub</h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-3xl bg-card p-6 shadow-[var(--shadow-card)]">
                <p className="font-display text-3xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-display text-xl font-semibold">Applications</h2>
          <div className="mt-4 space-y-3">
            {applications.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-5"
              >
                <div
                  className="flex size-11 items-center justify-center rounded-2xl font-display font-bold text-primary-foreground"
                  style={{ backgroundColor: a.jobs?.companies?.brand_color ?? undefined }}
                  aria-hidden
                >
                  {(a.jobs?.companies?.name ?? "M").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{a.jobs?.companies?.name}</p>
                  <p className="font-display font-semibold">{a.jobs?.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.jobs?.location} · {a.jobs && formatSalary(a.jobs)} · Applied {timeAgo(a.created_at)}
                  </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold capitalize text-accent-foreground">
                  {a.status}
                </span>
                <Button variant="ghost" size="icon" onClick={() => void withdraw(a.id)} aria-label="Withdraw">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                <Briefcase className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-3 font-display font-semibold">No applications yet</p>
                <Button asChild variant="brand" className="mt-4">
                  <Link to="/jobs">Browse roles</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside>
          <h2 className="font-display text-xl font-semibold">Bookmarks</h2>
          <div className="mt-4 space-y-3">
            {saved.map((s) => (
              <Link
                key={s.id}
                to="/jobs/$jobId"
                params={{ jobId: s.jobs?.id ?? "" }}
                className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <p className="text-xs text-muted-foreground">{s.jobs?.companies?.name}</p>
                <p className="font-display text-sm font-semibold">{s.jobs?.title}</p>
                <p className="text-xs text-muted-foreground">{s.jobs?.location}</p>
              </Link>
            ))}
            {saved.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <Bookmark className="mx-auto size-5" />
                <p className="mt-2">Bookmark roles from the job list.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <SiteFooter />
    </div>
  );
}
