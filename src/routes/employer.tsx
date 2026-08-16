import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { categories, employmentLabels, timeAgo, type EmploymentType } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employer")({
  head: () => ({
    meta: [
      { title: "Employer desk | Musicosy" },
      {
        name: "description",
        content:
          "Register your studio, label or touring company, publish music industry roles and review every applicant from one desk.",
      },
      { property: "og:title", content: "Employer desk | Musicosy" },
      {
        property: "og:description",
        content: "Post music industry roles and manage applicants on Musicosy.",
      },
    ],
  }),
  component: EmployerDesk,
});

const statuses = ["new", "reviewing", "interview", "offer", "rejected"] as const;

type CompanyRow = {
  id: string;
  name: string;
  tagline: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  brand_color: string;
};

type EmployerJob = {
  id: string;
  title: string;
  category: string;
  employment_type: EmploymentType;
  location: string;
  is_open: boolean;
  created_at: string;
  company_id: string;
};

type ApplicantRow = {
  id: string;
  status: (typeof statuses)[number];
  created_at: string;
  cover_note: string | null;
  portfolio_url: string | null;
  candidate_id: string;
  job_id: string;
  profiles?: { full_name: string; headline: string | null } | null;
};

function EmployerDesk() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"jobs" | "applicants" | "company">("jobs");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { mode: "up", as: "employer" } });
  }, [loading, user, navigate]);

  const { data: companies = [] } = useQuery({
    queryKey: ["my-companies", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id,name,tagline,location,website,description,brand_color")
        .eq("owner_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return data as CompanyRow[];
    },
  });

  const company = companies[0] ?? null;

  const { data: jobs = [] } = useQuery({
    queryKey: ["employer-jobs", company?.id],
    enabled: !!company,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,category,employment_type,location,is_open,created_at,company_id")
        .eq("company_id", company!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EmployerJob[];
    },
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ["employer-applicants", company?.id],
    enabled: !!company,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id,status,created_at,cover_note,portfolio_url,candidate_id,job_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as ApplicantRow[];
      const ids = [...new Set(rows.map((r) => r.candidate_id))];
      if (ids.length === 0) return rows;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,full_name,headline")
        .in("id", ids);
      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profiles: byId.get(r.candidate_id) ?? null }));
    },
  });

  async function setStatus(id: string, status: (typeof statuses)[number]) {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["employer-applicants", company?.id] });
  }

  const stats = [
    { label: "Live roles", value: jobs.filter((j) => j.is_open).length },
    { label: "Applicants", value: applicants.length },
    { label: "In review", value: applicants.filter((a) => a.status !== "new").length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-ink py-12 text-ink-foreground">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Employer workflow
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {company ? company.name : "Employer desk"}
          </h1>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-3xl bg-ink-foreground/5 p-6">
                <p className="font-display text-3xl font-bold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-ink-foreground/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {!company ? (
          <CompanyForm userId={user?.id} onDone={() => queryClient.invalidateQueries({ queryKey: ["my-companies", user?.id] })} />
        ) : (
          <>
            <div className="inline-flex gap-1 rounded-full bg-secondary p-1.5">
              {(
                [
                  { key: "jobs", label: "Job posts" },
                  { key: "applicants", label: "Applicants" },
                  { key: "company", label: "Company" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                    tab === t.key ? "bg-ink text-ink-foreground" : "text-muted-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "jobs" && (
              <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/jobs/$jobId"
                          params={{ jobId: job.id }}
                          className="font-display font-semibold hover:text-primary"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {job.category} · {employmentLabels[job.employment_type]} · {job.location} ·{" "}
                          {timeAgo(job.created_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold">
                        {applicants.filter((a) => a.job_id === job.id).length} applicants
                      </span>
                      <Button
                        variant="softOutline"
                        size="sm"
                        onClick={async () => {
                          await supabase
                            .from("jobs")
                            .update({ is_open: !job.is_open })
                            .eq("id", job.id);
                          void queryClient.invalidateQueries({
                            queryKey: ["employer-jobs", company.id],
                          });
                        }}
                      >
                        {job.is_open ? "Close" : "Reopen"}
                      </Button>
                    </div>
                  ))}
                  {jobs.length === 0 && (
                    <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                      <Building2 className="mx-auto size-6 text-muted-foreground" />
                      <p className="mt-3 font-display font-semibold">No roles posted yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Use the form to publish your first opening.
                      </p>
                    </div>
                  )}
                </div>

                <JobForm
                  companyId={company.id}
                  userId={user?.id}
                  onDone={() =>
                    queryClient.invalidateQueries({ queryKey: ["employer-jobs", company.id] })
                  }
                />
              </div>
            )}

            {tab === "applicants" && (
              <div className="mt-8 space-y-3">
                {applicants.map((a) => {
                  const job = jobs.find((j) => j.id === a.job_id);
                  return (
                    <div key={a.id} className="rounded-3xl border border-border bg-card p-5">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-semibold">
                            {a.profiles?.full_name || "Musicosy candidate"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {job?.title} · applied {timeAgo(a.created_at)}
                          </p>
                        </div>
                        <Select
                          value={a.status}
                          onValueChange={(v) => void setStatus(a.id, v as (typeof statuses)[number])}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {a.cover_note && (
                        <p className="mt-3 rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
                          {a.cover_note}
                        </p>
                      )}
                      {a.portfolio_url && (
                        <a
                          href={a.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
                        >
                          View portfolio
                        </a>
                      )}
                    </div>
                  );
                })}
                {applicants.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                    <Users className="mx-auto size-6 text-muted-foreground" />
                    <p className="mt-3 font-display font-semibold">No applicants yet</p>
                  </div>
                )}
              </div>
            )}

            {tab === "company" && (
              <div className="mt-8 max-w-xl">
                <CompanyForm
                  userId={user?.id}
                  existing={company}
                  onDone={() =>
                    queryClient.invalidateQueries({ queryKey: ["my-companies", user?.id] })
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function CompanyForm({
  userId,
  existing,
  onDone,
}: {
  userId?: string;
  existing?: CompanyRow | null;
  onDone: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [tagline, setTagline] = useState(existing?.tagline ?? "");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [website, setWebsite] = useState(existing?.website ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    const payload = { name, tagline, location, website, description, owner_id: userId };
    const { error } = existing
      ? await supabase.from("companies").update(payload).eq("id", existing.id)
      : await supabase.from("companies").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(existing ? "Company updated." : "Company created.");
    onDone();
  }

  return (
    <form
      onSubmit={submit}
      className="max-w-xl space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
    >
      <div>
        <h2 className="font-display text-xl font-semibold">
          {existing ? "Company details" : "Register your company"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is what candidates see on every role you post.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cname">Company name</Label>
        <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cloc">Location</Label>
          <Input id="cloc" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site">Website</Label>
          <Input id="site" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cdesc">About</Label>
        <Textarea
          id="cdesc"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button type="submit" variant="brand" disabled={busy}>
        {existing ? "Save changes" : "Create company"}
      </Button>
    </form>
  );
}

function JobForm({
  companyId,
  userId,
  onDone,
}: {
  companyId: string;
  userId?: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Production");
  const [type, setType] = useState<EmploymentType>("full_time");
  const [location, setLocation] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [period, setPeriod] = useState("year");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("jobs").insert({
      company_id: companyId,
      posted_by: userId ?? null,
      title,
      category,
      employment_type: type,
      location: location || "Remote",
      is_remote: location.toLowerCase().includes("remote"),
      salary_min: min ? Number(min) : null,
      salary_max: max ? Number(max) : null,
      salary_period: period,
      description,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Role published.");
    setTitle("");
    setDescription("");
    onDone();
  }

  return (
    <form
      onSubmit={submit}
      className="h-fit space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
    >
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Plus className="size-4 text-primary" /> Post a role
      </h2>
      <div className="space-y-2">
        <Label htmlFor="jtitle">Title</Label>
        <Input id="jtitle" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Contract</Label>
          <Select value={type} onValueChange={(v) => setType(v as EmploymentType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(employmentLabels) as EmploymentType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {employmentLabels[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jloc">Location</Label>
        <Input
          id="jloc"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Nashville, TN or Remote"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="min">Min pay</Label>
          <Input id="min" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max">Max pay</Label>
          <Input id="max" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Per</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["year", "day", "hour"].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jdesc">Description</Label>
        <Textarea
          id="jdesc"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <Button type="submit" variant="brand" className="w-full" disabled={busy}>
        Publish role
      </Button>
    </form>
  );
}
