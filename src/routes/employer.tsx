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
  component: EmployerDesk;
});

function EmployerDesk() {
  return null;
}
