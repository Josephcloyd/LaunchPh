import Link from "next/link";
import { BarChart3, FileStack, FolderKanban, Inbox, LayoutDashboard, Receipt, Users } from "lucide-react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";

export function AdminDashboardShell({ adminName, children }: { adminName: string; children: React.ReactNode }) {
  const navigation = [
    ["Overview", "/admin", LayoutDashboard], ["Revenue", "/admin#revenue", BarChart3],
    ["Requests", "/admin#requests", Inbox], ["Projects", "/admin#projects", FolderKanban],
    ["Orders", "/admin#orders", Receipt], ["Customers", "/admin#customers", Users],
    ["Templates", "/admin#templates", FileStack],
  ] as const;
  const initials = adminName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "AD";
  return <div className="site-shell app-layout admin-layout"><aside className="sidebar"><Brand href="/admin"/><nav className="side-nav" aria-label="Administrator navigation">{navigation.map(([label, href, Icon], index) => <Link key={label} href={href} className={index === 0 ? "active" : ""}><Icon size={17}/>{label}</Link>)}</nav><div className="side-bottom"><div className="user-row"><span className="avatar">{initials}</span><div><strong>{adminName}</strong><span>Administrator</span></div><SignOutButton compact className="user-signout"/></div></div></aside><main className="app-main">{children}</main></div>;
}
