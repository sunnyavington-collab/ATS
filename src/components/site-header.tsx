import { Link } from "@tanstack/react-router";
import { AudioLines, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Home", to: "/" },
  { label: "Find work", to: "/jobs" },
  { label: "For employers", to: "/employer" },
  { label: "My hub", to: "/candidate" },
];

export function SiteHeader() {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-ink text-ink-foreground">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <AudioLines className="size-4 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Musicosy</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-ink-foreground/70 transition-colors hover:text-primary [&.active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={role === "employer" ? "/employer" : "/candidate"}
                className="text-sm font-medium text-ink-foreground/70 hover:text-primary"
              >
                {role === "employer" ? "Employer desk" : "Candidate hub"}
              </Link>
              <Button variant="brand" size="sm" onClick={() => void signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "in" }} className="text-sm font-medium text-ink-foreground/70 hover:text-primary">
                Login
              </Link>
              <Button asChild variant="brand" size="sm">
                <Link to="/auth" search={{ mode: "up" }}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <div className={cn("border-t border-ink-foreground/10 md:hidden", open ? "block" : "hidden")}>
        <div className="flex flex-col gap-1 px-4 py-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm text-ink-foreground/80"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Button variant="brand" size="sm" className="mt-2" onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : (
            <Button asChild variant="brand" size="sm" className="mt-2">
              <Link to="/auth" search={{ mode: "up" }} onClick={() => setOpen(false)}>
                Get started
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
