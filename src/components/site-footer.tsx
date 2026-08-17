import { Link } from "@tanstack/react-router";
import { AudioLines } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <AudioLines className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold">Musicosy</span>
          </div>
          <p className="mt-3 text-sm text-ink-foreground/60">
            The hiring floor for the music industry — studios, stages, labels and the people who
            keep them running.
          </p>
        </div>
        <div className="flex gap-10 text-sm">
          <div className="space-y-2">
            <p className="font-display font-semibold">Candidates</p>
            <Link to="/jobs" className="block text-ink-foreground/60 hover:text-primary">
              Browse roles
            </Link>
            <Link to="/candidate" className="block text-ink-foreground/60 hover:text-primary">
              Candidate hub
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-display font-semibold">Employers</p>
            <Link to="/employer" className="block text-ink-foreground/60 hover:text-primary">
              Employer desk
            </Link>
            <Link to="/auth" search={{ mode: "up" }} className="block text-ink-foreground/60 hover:text-primary">
              Post a role
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10 py-5 text-center text-xs text-ink-foreground/50">
        © {new Date().getFullYear()} Musicosy. All rights reserved.
      </div>
    </footer>
  );
}
