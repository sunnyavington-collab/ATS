import { Link } from "@tanstack/react-router";
import { Bookmark, CalendarDays, MapPin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { employmentLabels, formatSalary, timeAgo, type JobRow } from "@/lib/jobs";
import { cn } from "@/lib/utils";

export function JobCard({
  job,
  saved,
  onToggleSave,
}: {
  job: JobRow;
  saved?: boolean;
  onToggleSave?: (job: JobRow) => void;
}) {
  return (
    <article className="group flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 md:flex-row md:items-center">
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold text-primary-foreground"
        style={{ backgroundColor: job.companies?.brand_color ?? undefined }}
        aria-hidden
      >
        {(job.companies?.name ?? "M").charAt(0)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{job.companies?.name}</p>
        <Link
          to="/jobs/$jobId"
          params={{ jobId: job.id }}
          className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-primary"
        >
          {job.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" /> {job.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" /> {timeAgo(job.created_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Wallet className="size-3.5" /> {formatSalary(job)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:w-auto">
        {job.featured && (
          <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-foreground">
            Featured
          </span>
        )}
        <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
          {employmentLabels[job.employment_type]}
        </span>
        <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground">
          {job.category}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild variant="brand" size="sm">
          <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
            Apply now
          </Link>
        </Button>
        {onToggleSave && (
          <button
            type="button"
            aria-label={saved ? "Remove bookmark" : "Save job"}
            onClick={() => onToggleSave(job)}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-border transition-colors",
              saved ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
            )}
          >
            <Bookmark className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}
