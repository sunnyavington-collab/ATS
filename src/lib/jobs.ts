import { supabase } from "@/integrations/supabase/client";

export type EmploymentType = "full_time" | "part_time" | "contract" | "freelance" | "internship";

export type JobRow = {
  id: string;
  company_id: string;
  title: string;
  category: string;
  employment_type: EmploymentType;
  location: string;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  salary_period: string;
  description: string;
  requirements: string | null;
  tags: string[];
  featured: boolean;
  is_open: boolean;
  created_at: string;
  companies: {
    id: string;
    name: string;
    tagline: string | null;
    location: string | null;
    website: string | null;
    description: string | null;
    brand_color: string;
  } | null;
};

const JOB_SELECT =
  "*, companies(id,name,tagline,location,website,description,brand_color)";

export const employmentLabels: Record<EmploymentType, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
};

export const categories = [
  "Production",
  "Live",
  "Engineering",
  "A&R",
  "Booking",
  "Performance",
  "Creative",
  "Marketing",
] as const;

export async function fetchJobs(): Promise<JobRow[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(JOB_SELECT)
    .eq("is_open", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as JobRow[];
}

export async function fetchJob(id: string): Promise<JobRow | null> {
  const { data, error } = await supabase.from("jobs").select(JOB_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as JobRow) ?? null;
}

export function formatSalary(job: Pick<JobRow, "salary_min" | "salary_max" | "salary_period">) {
  if (!job.salary_min && !job.salary_max) return "Rate on request";
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
  const range =
    job.salary_min && job.salary_max
      ? `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`
      : fmt((job.salary_min ?? job.salary_max) as number);
  return `${range} / ${job.salary_period}`;
}

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}
