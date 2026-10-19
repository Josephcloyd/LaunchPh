import Link from "next/link";
import { BarChart3, FileStack, FolderKanban, LayoutDashboard, Settings, Users } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const navigation = [
    ["Overview", "/admin", LayoutDashboard], ["Customers", "/admin#customers", Users],
    ["Templates", "/admin#templates", FileStack], ["Projects", "/admin#projects", FolderKanban],
    ["Revenue", "/admin#revenue", BarChart3], ["Settings", "/admin#settings", Settings],
  ] as const;
  return <div className="site-shell app-layout admin-layout"><aside className="sidebar"><Brand href="/admin"/><nav className="side-nav" aria-label="Administrator navigation">{navigation.map(([label, href, Icon], index) => <Link key={label} href={href} className={index === 0 ? "active" : ""}><Icon size={17}/>{label}</Link>)}</nav><div className="side-bottom"><div className="user-row"><span className="avatar">AD</span><div><strong>GetLaunch PH Admin</strong><span>Administrator</span></div><SignOutButton compact className="user-signout"/></div></div></aside><main className="app-main">{children}</main></div>;
}
