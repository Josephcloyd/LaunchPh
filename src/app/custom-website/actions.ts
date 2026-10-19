"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/services/supabase-server";

const inquirySchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  middleName: z.string().trim().max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.email().max(200),
  phone: z.string().trim().max(40),
  businessName: z.string().trim().min(2).max(140),
  websiteType: z.enum(["local_business", "professional", "catalogue", "other"]),
  budgetRange: z.enum(["under_10000", "10000_25000", "25000_50000", "50000_plus", "not_sure"]),
  domainStatus: z.enum(["need_domain", "have_domain", "not_sure"]),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().trim().min(20).max(2000),
  website: z.string().max(0),
});

export async function submitWebsiteInquiry(formData: FormData) {
  const parsed = inquirySchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    middleName: String(formData.get("middleName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    businessName: String(formData.get("businessName") ?? ""),
    websiteType: String(formData.get("websiteType") ?? ""),
    budgetRange: String(formData.get("budgetRange") ?? ""),
    domainStatus: String(formData.get("domainStatus") ?? ""),
    preferredDate: String(formData.get("preferredDate") ?? ""),
    preferredTime: String(formData.get("preferredTime") ?? ""),
    message: String(formData.get("message") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  if (!parsed.success) redirect("/custom-website?error=Please+complete+all+required+fields");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("website_inquiries").insert({
    first_name: parsed.data.firstName,
    middle_name: parsed.data.middleName || null,
    last_name: parsed.data.lastName,
    full_name: [parsed.data.firstName, parsed.data.middleName, parsed.data.lastName].filter(Boolean).join(" "),
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    business_name: parsed.data.businessName,
    website_type: parsed.data.websiteType,
    budget_range: parsed.data.budgetRange,
    domain_status: parsed.data.domainStatus,
    preferred_meeting_date: parsed.data.preferredDate,
    preferred_meeting_time: parsed.data.preferredTime,
    timezone: "Asia/Manila",
    message: parsed.data.message,
  });

  if (error) redirect("/custom-website?error=Consultation+requests+are+temporarily+unavailable");
  redirect("/custom-website?submitted=1");
}
