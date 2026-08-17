import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Disc3,
  Headphones,
  Megaphone,
  Mic2,
  Search,
  Sliders,
  Speaker,
  Star,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JobCard } from "@/components/job-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchJobs } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import hero1 from "@/assets/hero1.jpg.asset.json";
import hero2 from "@/assets/hero2.jpg.asset.json";
import hero3 from "@/assets/hero3.jpg.asset.json";
import hero4 from "@/assets/hero4.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Musicosy — Jobs for the music industry" },
      {
        name: "description",
        content:
          "Musicosy connects studios, labels, venues and touring companies with engineers, players, A&R and crew. Browse roles or hire talent in minutes.",
      },
      { property: "og:title", content: "Musicosy — Jobs for the music industry" },
      {
        property: "og:description",
        content: "Find music work or hire music people. Two workflows, one hiring floor.",
      },
    ],
  }),
  component: Home,
});

const categoryIcons = [
  { name: "Production", icon: Sliders, count: "240+" },
  { name: "Live", icon: Speaker, count: "180+" },
  { name: "Engineering", icon: Headphones, count: "96+" },
  { name: "A&R", icon: Disc3, count: "64+" },
  { name: "Performance", icon: Mic2, count: "310+" },
  { name: "Marketing", icon: Megaphone, count: "120+" },
];

const filters = ["All", "Production", "Live", "Engineering", "Marketing"] as const;

function Home() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [where, setWhere] = useState("");
  const [tab, setTab] = useState<(typeof filters)[number]>("All");

  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const featured = jobs.filter((j) => (tab === "All" ? true : j.category === tab)).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
        Hiring for a session, a tour or a whole department? Post it free this month.
      </div>
      <SiteHeader />

      {/* Hero */}
      <section className="bg-canvas pb-0 pt-14">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h1 className="font-display text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl">
            Unlock your next credit:
            <br />
            find your <span className="text-primary">perfect music job</span> today
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Musicosy is where studios, labels, venues and touring companies meet the people who make
            the records and run the shows.
          </p>

          <form
            className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-3xl bg-card p-3 shadow-[var(--shadow-card)] md:flex-row md:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: "/jobs", search: { q: term || undefined, loc: where || undefined } });
            }}
          >
            <div className="flex-1 border-border px-3 py-1 text-left md:border-r">
              <label htmlFor="q" className="text-[11px] font-medium text-muted-foreground">
                Keywords or title
              </label>
              <Input
                id="q"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Mixing engineer"
                className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <div className="flex-1 px-3 py-1 text-left">
              <label htmlFor="loc" className="text-[11px] font-medium text-muted-foreground">
                Location
              </label>
              <Input
                id="loc"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Nashville, remote…"
                className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" variant="brand" size="lg" className="md:w-36">
              <Search className="size-4" /> Search
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground">Popular:</span>
            {["Mixing", "Tour manager", "Session bass", "A&R", "Sound design"].map((p) => (
              <Link
                key={p}
                to="/jobs"
                search={{ q: p }}
                className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>

        {/* Stacked photo strip */}
        <div className="mx-auto mt-12 grid max-w-7xl grid-cols-2 gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-4">
          {[
            { src: hero1.url, alt: "Audio engineer with headphones", tilt: "tilt-left" },
            { src: hero2.url, alt: "Music producer waving", tilt: "tilt-right" },
            { src: hero3.url, alt: "Bass player giving a thumbs up", tilt: "tilt-left" },
            { src: hero4.url, alt: "Music professional celebrating a new job", tilt: "tilt-right" },
          ].map((p, i) => (
            <div key={p.src} className={cn("photo-tile", p.tilt)}>
              <img
                src={p.src}
                alt={p.alt}
                width={700}
                height={860}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-56 w-full object-cover sm:h-72"
              />
              {i === 3 && (
                <span className="absolute bottom-3 left-3 rounded-xl bg-card px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-card)]">
                  Yes! Got my first credit
                </span>
              )}
              {i === 1 && (
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-xl bg-card px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-card)]">
                  <Star className="size-3.5 fill-primary text-primary" /> 4.9 average rating
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Popular <span className="text-primary">job categories</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every corner of the industry, one search away.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all categories <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categoryIcons.map((c) => (
            <Link
              key={c.name}
              to="/jobs"
              search={{ cat: c.name }}
              className="group rounded-3xl border border-border bg-card p-5 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
            >
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon className="size-5" />
              </span>
              <p className="mt-3 font-display text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.count} jobs</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 sm:px-6 lg:grid-cols-2">
        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="photo-tile tilt-left">
                <img
                  src={hero3.url}
                  alt="Musician with a bass guitar"
                  width={700}
                  height={860}
                  loading="lazy"
                  className="h-44 w-full object-cover"
                />
              </div>
              <div className="rounded-3xl bg-ink p-4 text-ink-foreground">
                <p className="font-display text-2xl font-bold">5K+</p>
                <p className="text-xs text-ink-foreground/60">people found their next credit</p>
              </div>
            </div>
            <div className="photo-tile tilt-right bg-primary">
              <img
                src={hero1.url}
                alt="Audio engineer at work"
                width={700}
                height={860}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="dot-grid absolute -bottom-6 -left-6 size-24 rounded-xl" aria-hidden />
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Choose your dream role from over <span className="text-primary">50,000+ jobs</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            We built Musicosy because music hiring still happens in group chats. Now every studio
            call, tour run and label opening lives in one place — with the workflow that fits you.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Search by craft, city, rate and contract type",
              "Apply once, track every conversation",
              "Employers manage companies, posts and applicants in one desk",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <Button asChild variant="softOutline" size="lg" className="mt-7">
            <Link to="/jobs">Search jobs now</Link>
          </Button>
        </div>
      </section>

      {/* Featured jobs */}
      <section className="bg-canvas py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Featured <span className="text-primary">jobs</span>
            </h2>
            <div className="mt-5 inline-flex flex-wrap justify-center gap-2 rounded-full bg-card p-1.5 shadow-[var(--shadow-card)]">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTab(f)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                    tab === f
                      ? "bg-ink text-ink-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {featured.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
            {featured.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No open roles in this category right now.
              </p>
            )}
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="ink" size="lg">
              <Link to="/jobs">Browse all jobs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            How <span className="text-primary">Musicosy</span> works for you
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Set up in under a minute.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Create an account",
              body: "Pick candidate or employer — that choice sets your whole workflow.",
            },
            {
              step: "02",
              title: "Build your profile",
              body: "Credits, city and craft for candidates. Company and brand for employers.",
            },
            {
              step: "03",
              title: "Apply or hire",
              body: "Candidates apply and track. Employers review applicants and move them along.",
            },
          ].map((s, i) => (
            <div key={s.step} className="relative">
              <div
                className={cn(
                  "rounded-3xl p-6",
                  i === 1 ? "bg-ink text-ink-foreground" : "bg-accent text-foreground",
                )}
              >
                <span
                  className={cn(
                    "font-display text-4xl font-bold",
                    i === 1 ? "text-primary" : "text-primary",
                  )}
                >
                  {s.step}
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p
                  className={cn(
                    "mt-2 text-sm",
                    i === 1 ? "text-ink-foreground/60" : "text-muted-foreground",
                  )}
                >
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Split workflow CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-4xl bg-ink p-10 text-ink-foreground">
            <Users className="size-7 text-primary" />
            <h3 className="mt-5 font-display text-2xl font-bold">For candidates</h3>
            <p className="mt-3 text-sm text-ink-foreground/60">
              One hub for the roles you saved, the applications you sent and where each one stands.
            </p>
            <Button asChild variant="brand" className="mt-6">
              <Link to="/auth" search={{ mode: "up", as: "candidate" }}>
                Find work <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="rounded-4xl bg-primary p-10 text-primary-foreground">
            <Disc3 className="size-7" />
            <h3 className="mt-5 font-display text-2xl font-bold">For employers</h3>
            <p className="mt-3 text-sm text-primary-foreground/80">
              Register your company, publish roles and review every applicant from one desk.
            </p>
            <Button asChild variant="ink" className="mt-6">
              <Link to="/auth" search={{ mode: "up", as: "employer" }}>
                Start hiring <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
