import Link from "next/link";
import { ExternalLink, FileStack, FolderKanban, Heart, Inbox, Mail, Phone, Receipt, Sparkles, Store, Users } from "lucide-react";
import { RefundButton, RequestStatusSelect } from "@/features/admin/admin-controls";
import { requestStatuses, type CustomerRow, type OrderRow, type ProjectMix, type ProjectRow, type RequestKind, type RequestRow, type TemplateRow } from "@/features/admin/admin-data";
import { inboxKinds } from "@/features/admin/admin-overview";
import { dateTime, initials, methodLabels, peso, shortDate } from "@/features/admin/format";

type Filter = { value: string; label: string; count?: number };

/** Tabs that filter a list through the page's query string. */
function FilterTabs({ base, param, current, options }: { base: string; param: string; current: string; options: Filter[] }) {
  return <nav className="adm-tabs" aria-label="Filter">{options.map(option => {
    const href = option.value === options[0].value ? base : `${base}?${param}=${option.value}`;
    return <Link key={option.value} href={href} className={current === option.value ? "active" : ""} aria-current={current === option.value ? "page" : undefined}>{option.label}{option.count !== undefined && <span>{option.count}</span>}</Link>;
  })}</nav>;
}

function Empty({ icon: Icon, text }: { icon: typeof Inbox; text: string }) {
  return <div className="adm-empty"><Icon size={22}/><p>{text}</p></div>;
}

// ---------------------------------------------------------------- Requests

export function AdminRequests({ rows, kind, show }: { rows: RequestRow[]; kind: string; show: string }) {
  const open = (row: RequestRow) => row.status !== "closed" && row.status !== "resolved";
  const byKind = kind === "all" ? rows : rows.filter(row => row.kind === kind);
  const visible = show === "all" ? byKind : byKind.filter(open);
  const count = (k: RequestKind | "all") => (k === "all" ? rows : rows.filter(row => row.kind === k)).filter(open).length;
  const kindTabs: Filter[] = [{ value: "all", label: "Everything", count: count("all") }, { value: "website", label: "Custom websites", count: count("website") }, { value: "job", label: "Job applications", count: count("job") }, { value: "support", label: "Support tickets", count: count("support") }];
  const base = kind === "all" ? "/admin/requests" : `/admin/requests?kind=${kind}`;
  return <section className="panel glass adm-row">
    <div className="adm-filter-row">
      <FilterTabs base="/admin/requests" param="kind" current={kind} options={kindTabs}/>
      <Link className="adm-toggle-link" href={show === "all" ? base : `${base}${base.includes("?") ? "&" : "?"}show=all`}>{show === "all" ? "Hide closed" : "Show closed too"}</Link>
    </div>
    {visible.length === 0 ? <Empty icon={Inbox} text={show === "all" ? "No requests here yet." : "Nothing open here. You’re all caught up."}/> :
      <ul className="adm-request-list">{visible.map(row => {
        const { label, icon: Icon } = inboxKinds[row.kind];
        return <li key={`${row.kind}-${row.id}`} className="adm-request">
          <div className="adm-request-head">
            <span className="adm-inbox-icon"><Icon size={16}/></span>
            <div className="adm-request-title"><p className="adm-inbox-kind">{label} · {dateTime(row.createdAt)}</p><h3>{row.title}</h3><p>{row.detail}</p></div>
            <RequestStatusSelect kind={row.kind} id={row.id} status={row.status} options={requestStatuses[row.kind]}/>
          </div>
          <p className="adm-request-message">{row.message}</p>
          <div className="adm-request-meta">
            {row.email && <a href={`mailto:${row.email}`}><Mail size={13}/> {row.email}</a>}
            {row.phone && <a href={`tel:${row.phone}`}><Phone size={13}/> {row.phone}</a>}
            {row.extra.map(item => <span key={item}>{item}</span>)}
          </div>
        </li>;
      })}</ul>}
  </section>;
}

// ---------------------------------------------------------------- Projects

export function AdminProjects({ rows, mix, show, now }: { rows: ProjectRow[]; mix: ProjectMix[]; show: string; now: number }) {
  const visible = show === "published" ? rows.filter(row => row.status === "published") : show === "draft" ? rows.filter(row => row.status !== "published") : rows;
  const mixMax = Math.max(1, ...mix.map(row => row.count));
  return <>
    <section className="panel glass adm-row">
      <div className="panel-head"><h2>Projects by type</h2><span className="fine">Published / total</span></div>
      <ul className="adm-mix adm-mix-wide">{mix.map(row => <li key={row.label}>
        <div className="adm-mix-label"><span>{row.label}</span><b>{row.published} / {row.count}</b></div>
        <span className="adm-meter" role="img" aria-label={`${row.label}: ${row.published} published of ${row.count}`}><i style={{ width: `${(row.count / mixMax) * 100}%` }}><i style={{ width: row.count ? `${(row.published / row.count) * 100}%` : 0 }}/></i></span>
      </li>)}</ul>
    </section>
    <section className="panel glass adm-row">
      <div className="adm-filter-row"><FilterTabs base="/admin/projects" param="show" current={show} options={[{ value: "all", label: "All", count: rows.length }, { value: "published", label: "Published", count: rows.filter(r => r.status === "published").length }, { value: "draft", label: "Drafts", count: rows.filter(r => r.status !== "published").length }]}/></div>
      {visible.length === 0 ? <Empty icon={FolderKanban} text="No projects here yet."/> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Project</th><th>Type</th><th>Owner</th><th>Status</th><th>Business plan</th><th>Updated</th><th><span className="sr-only">Live page</span></th></tr></thead><tbody>{visible.map(row => {
          const lapsed = row.paidUntil && new Date(row.paidUntil).getTime() < now;
          return <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.type}</td><td>{row.owner}</td><td><span className={`status-pill ${row.status}`}>{row.status}</span></td><td>{row.paidUntil ? <span className={lapsed ? "adm-warn" : ""}>{lapsed ? "Ended " : "Paid until "}{shortDate(row.paidUntil)}</span> : "—"}</td><td>{shortDate(row.updatedAt)}</td><td>{row.liveUrl ? <a className="adm-link" href={row.liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> View</a> : ""}</td></tr>;
        })}</tbody></table></div>}
    </section>
  </>;
}

// ---------------------------------------------------------------- Orders

const orderLabel = (row: OrderRow) => row.status === "pending" ? (row.submitted ? "awaiting confirmation" : "not paid yet") : row.status.replace("_", " ");

export function AdminOrders({ rows, show }: { rows: OrderRow[]; show: string }) {
  const groups: Record<string, (row: OrderRow) => boolean> = {
    all: row => row.status !== "pending" || row.submitted,
    awaiting: row => row.status === "pending" && row.submitted,
    paid: row => row.status === "paid" || row.status === "partially_refunded",
    refunded: row => row.status === "refunded",
    declined: row => row.status === "failed" && !row.note?.startsWith("Replaced"),
    unpaid: row => row.status === "pending" && !row.submitted,
  };
  const visible = rows.filter(groups[show] ?? groups.all);
  const tabs: Filter[] = [["all", "All"], ["awaiting", "Awaiting confirmation"], ["paid", "Paid"], ["refunded", "Refunded"], ["declined", "Declined"], ["unpaid", "Started, not paid"]].map(([value, label]) => ({ value, label, count: rows.filter(groups[value]).length }));
  return <section className="panel glass adm-row">
    <div className="adm-filter-row"><FilterTabs base="/admin/orders" param="show" current={show in groups ? show : "all"} options={tabs}/></div>
    {visible.length === 0 ? <Empty icon={Receipt} text="No orders here yet."/> :
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Status</th><th>Date</th><th className="num">Total</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(row => <tr key={row.id}>
        <td><strong>{row.reference}</strong><br/><span className="fine">{row.item}{row.projectName && ` · ${row.projectName}`}</span></td>
        <td>{row.customer}</td>
        <td>{row.method ? methodLabels[row.method] ?? row.method : "—"}{row.customerReference && <><br/><code className="payment-ref">{row.customerReference}</code></>}</td>
        <td><span className={`status-pill ${row.status}`}>{orderLabel(row)}</span>{row.note && row.status !== "pending" && <small className="order-note">{row.note}</small>}</td>
        <td>{shortDate(row.paidAt ?? row.createdAt)}</td>
        <td className="num"><strong>{peso(row.totalCentavos)}</strong>{row.discountCentavos > 0 && <><br/><span className="fine">−{peso(row.discountCentavos)} referral</span></>}</td>
        <td>{(row.status === "paid" || row.status === "partially_refunded") && <RefundButton id={row.id} reference={row.reference} total={peso(row.totalCentavos)}/>}</td>
      </tr>)}</tbody></table></div>}
    <p className="fine adm-footnote">Awaiting confirmation orders are confirmed on the Overview. Refund only after sending the money back; invitations are unpublished when refunded.</p>
  </section>;
}

// ---------------------------------------------------------------- Customers

export function AdminCustomers({ rows }: { rows: CustomerRow[] }) {
  return <section className="panel glass adm-row">
    {rows.length === 0 ? <Empty icon={Users} text="No sign-ups yet."/> :
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Customer</th><th>Email</th><th>Joined</th><th className="num">Projects</th><th className="num">Paid orders</th><th className="num">Spent</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}>
        <td><span className="adm-person"><span className="avatar">{initials(row.name)}</span><span><strong>{row.name}</strong>{row.role !== "customer" && <span className="status-pill">{row.role}</span>}</span></span></td>
        <td>{row.email ? <a className="adm-link" href={`mailto:${row.email}`}>{row.email}</a> : "—"}</td>
        <td>{shortDate(row.joinedAt)}</td>
        <td className="num">{row.projects}</td>
        <td className="num">{row.paidOrders}</td>
        <td className="num">{peso(row.spentCentavos)}</td>
      </tr>)}</tbody></table></div>}
  </section>;
}

// ---------------------------------------------------------------- Templates

const builtIn = [
  { key: "wedding", name: "Evergreen Vows", kind: "Wedding invitation", price: "₱799", icon: Heart },
  { key: "debut", name: "Debut invitation", kind: "18th birthday invitation", price: "₱999", icon: Sparkles },
  { key: "business", name: "Business website", kind: "One-page business site", price: "₱299/month", icon: Store },
] as const;

export function AdminTemplates({ rows, usage }: { rows: TemplateRow[]; usage: Record<"wedding" | "debut" | "business", number> }) {
  return <>
    <section className="panel glass adm-row">
      <div className="panel-head"><h2>Built-in designs</h2><Link href="/templates" target="_blank">See the public templates page</Link></div>
      <div className="adm-design-grid">{builtIn.map(design => <article key={design.key} className="adm-design">
        <span className="adm-inbox-icon"><design.icon size={16}/></span>
        <div><h3>{design.name}</h3><p>{design.kind} · {design.price}</p></div>
        <strong>{usage[design.key]}<small>{usage[design.key] === 1 ? " project" : " projects"}</small></strong>
      </article>)}</div>
    </section>
    <section className="panel glass adm-row">
      <div className="panel-head"><h2>Template records</h2><span className="fine">Managed in Supabase</span></div>
      {rows.length === 0 ? <Empty icon={FileStack} text="No template records in the database. The built-in designs above don’t need one."/> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Template</th><th>Category</th><th>Status</th><th>Updated</th><th className="num">Price</th></tr></thead><tbody>{rows.map(t => <tr key={t.id}><td><strong>{t.name}</strong></td><td>{t.category}</td><td><span className={`status-pill ${t.status}`}>{t.status}</span></td><td>{shortDate(t.updatedAt)}</td><td className="num">{t.priceCentavos ? peso(t.priceCentavos) : "Free"}</td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
