"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/services/supabase-server";

const optionalUrl = z.union([z.literal(""), z.url().max(1000)]);
const serviceSchema = z.enum(["resume_review", "cover_letter", "linkedin_review", "portfolio_review", "interview_prep"]);
const inquirySchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  middleName: z.string().trim().max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.email().max(200),
  phone: z.string().trim().max(40),
  targetRole: z.string().trim().min(2).max(140),
  experienceLevel: z.enum(["student", "entry", "mid", "senior", "career_change"]),
  requestedServices: z.array(serviceSchema).min(1).max(5),
  jobPostingUrl: optionalUrl,
  linkedInUrl: optionalUrl,
  message: z.string().trim().min(20).max(2000),
  website: z.string().max(0),
});

export async function submitJobApplicationInquiry(formData: FormData) {
  const parsed = inquirySchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    targetRole: String(formData.get("targetRole") ?? ""),
    experienceLevel: String(formData.get("experienceLevel") ?? ""),
    requestedServices: formData.getAll("requestedServices").map(String),
    jobPostingUrl: String(formData.get("jobPostingUrl") ?? ""),
    linkedInUrl: String(formData.get("linkedInUrl") ?? ""),
    message: String(formData.get("message") ?? ""),
    website: String(formData.get("website") ?? ""),
  });
  if (!parsed.success) redirect("/job-application-bundle?error=Please+complete+the+required+fields+and+choose+at+least+one+service");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("job_application_inquiries").insert({
    first_name: parsed.data.firstName,
    middle_name: parsed.data.middleName || null,
    last_name: parsed.data.lastName,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    target_role: parsed.data.targetRole,
    experience_level: parsed.data.experienceLevel,
    requested_services: parsed.data.requestedServices,
    job_posting_url: parsed.data.jobPostingUrl || null,
    linkedin_url: parsed.data.linkedInUrl || null,
    message: parsed.data.message,
  });
  if (error) redirect("/job-application-bundle?error=Requests+are+temporarily+unavailable");
  redirect("/job-application-bundle?submitted=1");
}

