import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BusinessSite } from "@/components/business-site";
import { businessSiteSchema } from "@/lib/business-schema";
import { createSupabaseServerClient } from "@/services/supabase-server";

const getBusinessSite = cache(async (slug: string) => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_business_site", { requested_slug: slug }).maybeSingle();
  const row = data as { content?: unknown } | null;
  if (error || !row?.content || typeof row.content !== "object") return null;
  const parsed = businessSiteSchema.safeParse(row.content);
  return parsed.success ? parsed.data : null;
});

export async function generateMetadata({ params }: PageProps<"/site/[slug]">): Promise<Metadata> {
  const site = await getBusinessSite((await params).slug);
  if (!site) return { title: "Business not found" };
  return {
    title: { absolute: site.businessName },
    description: site.tagline || site.about.slice(0, 160) || `${site.businessName} — made by GetLaunch PH.`,
  };
}

export default async function PublishedBusinessSitePage({ params }: PageProps<"/site/[slug]">) {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  if (!site) notFound();
  return <main className="published-business-page"><BusinessSite {...site} slug={slug}/></main>;
}
