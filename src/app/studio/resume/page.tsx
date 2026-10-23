import { redirect } from "next/navigation";

// Older resume projects open the separate resume builder when its address is configured;
// until then they go to the Job Application Bundle, which offers resume help.
export default function LegacyResumeStudioPage() {
  const builder = process.env.NEXT_PUBLIC_RESUME_BUILDER_URL;
  redirect(builder?.startsWith("https://") ? builder : "/job-application-bundle");
}
