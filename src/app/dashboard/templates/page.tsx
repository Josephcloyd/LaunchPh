import { TemplateWorkspace, type TemplateRecord } from "@/features/dashboard/template-workspace";
import { requireUser } from "@/services/supabase-server";

export default async function DashboardTemplatesPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("templates").select("id, name, category, description, price_centavos, preview_path").eq("status", "published").order("published_at", { ascending: false });
  const launchPhTemplates = (data ?? []).filter(template => !template.category.toLowerCase().includes("resume"));
  return <div className="workspace-page"><header className="workspace-page-header"><div><p className="workspace-kicker">Templates</p><h1>Choose your starting point</h1><p>Only validated, customer-ready templates are shown here.</p></div></header><section className="workspace-section workspace-section-main">{error ? <div className="workspace-error"><h2>Templates are unavailable.</h2><p>{error.message}</p></div> : <TemplateWorkspace templates={launchPhTemplates as TemplateRecord[]}/>}</section></div>;
}
