import { redirect } from "next/navigation";

export default function LegacyResumeStudioPage() {
  redirect(process.env.NEXT_PUBLIC_RESUME_BUILDER_URL ?? "https://resume.launchph.ph");
}
