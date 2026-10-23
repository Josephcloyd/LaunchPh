import Link from "next/link";
import { FileStack, FolderKanban, Inbox, LayoutDashboard, Receipt, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";

const navigation = [
  ["Overview", "/admin", LayoutDashboard],
  ["Requests", "/admin/requests", Inbox],
  ["Projects", "/admin/projects", FolderKanban],
  ["Orders", "/admin/orders", Receipt],
  ["Customers", "/admin/customers", Users],
  ["Templates", "/admin/templates", FileStack],
] as const;

export function AdminDashboardShell({ adminName, current, children }: { adminName: string; current: string; children: ReactNode }) {
  const initials = adminName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "AD";
  return <div className="site-shell app-layout admin-layout"><aside className="sidebar"><Brand href="/admin"/><nav className="side-nav" aria-label="Administrator navigation">{navigation.map(([label, href, Icon]) => <Link key={label} href={href} className={href === current ? "active" : ""} aria-current={href === current ? "page" : undefined}><Icon size={17}/>{label}</Link>)}</nav><div className="side-bottom"><div className="user-row"><span className="avatar">{initials}</span><div><strong>{adminName}</strong><span>Administrator</span></div><SignOutButton compact className="user-signout"/></div></div></aside><main className="app-main">{children}</main></div>;
}

/** The title row at the top of each admin page. */
export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <header className="adm-topbar"><div><p className="adm-date">Administrator</p><h1>{title}</h1><p className="adm-subtitle">{description}</p></div>{actions && <div className="top-actions">{actions}</div>}</header>;
}
