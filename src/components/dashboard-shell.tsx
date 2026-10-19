"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FileStack, FolderKanban, House, LayoutDashboard, Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { SupportChat } from "@/features/dashboard/support-chat";

type WorkspaceUser = { name: string; email: string; initials: string; plan: string };
type ShellProps = { children: React.ReactNode; user: WorkspaceUser };

const navigation = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Projects", "/dashboard/projects", FolderKanban],
  ["Templates", "/dashboard/templates", FileStack],
  ["Billing", "/dashboard/billing", CreditCard],
  ["Settings", "/dashboard/settings", Settings],
] as const;

export function DashboardShell({ children, user }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  return (
    <div className="site-shell app-layout workspace-layout">
      <button className="workspace-mobile-menu" onClick={() => setOpen(true)} aria-label="Open workspace navigation"><Menu size={20}/></button>
      {open && <button className="workspace-overlay" onClick={() => setOpen(false)} aria-label="Close workspace navigation"/>}
      <aside className={`sidebar workspace-sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand-row"><Brand href="/dashboard"/><button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={19}/></button></div>
        <p className="sidebar-label">Workspace</p>
        <nav className="side-nav" aria-label="Workspace navigation">
          {navigation.map(([label, href, Icon]) => <Link key={label} href={href} className={active(href) ? "active" : ""} onClick={() => setOpen(false)}><Icon size={17}/>{label}</Link>)}
        </nav>
        <p className="sidebar-label">GetLaunch PH</p>
        <nav className="side-nav" aria-label="Main site">
          <Link href="/" onClick={() => setOpen(false)}><House size={17}/>Back to main site</Link>
        </nav>
        <div className="side-bottom">
          <div className="user-row"><span className="avatar">{user.initials}</span><div><strong>{user.name}</strong><span>{user.plan}</span></div><SignOutButton compact className="user-signout"/></div>
        </div>
      </aside>
      <main className="app-main workspace-main">{children}</main>
      <SupportChat/>
    </div>
  );
}
