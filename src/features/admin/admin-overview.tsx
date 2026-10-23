import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, ExternalLink, FileStack, Globe, Inbox, LifeBuoy, Mail, Minus, Users } from "lucide-react";
import type { AdminOverviewData, InboxItem } from "@/features/admin/admin-data";
import { PaymentReview } from "@/features/admin/payment-review";
import { RefreshButton } from "@/features/admin/refresh-button";

const peso = (centavos: number) => `₱${(centavos / 100).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
const compactPeso = (centavos: number) => `₱${new Intl.NumberFormat("en-PH", { notation: "compact", maximumFractionDigits: 1 }).format(centavos / 100)}`;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });

function timeAgo(iso: string, now: number) {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (minutes < 60) return rtf.format(-minutes, "minute");
  if (minutes < 60 * 24) return rtf.format(-Math.round(minutes / 60), "hour");
  if (minutes < 60 * 24 * 30) return rtf.format(-Math.round(minutes / 1440), "day");
  return shortDate(iso);
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
}

/** Round the axis maximum up to a clean step so ticks read ₱0 / ₱5K / ₱10K. */
function niceMax(value: number) {
  if (value <= 0) return 100000; // ₱1,000 so an empty chart still has a scale
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find(s => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

const inboxKinds: Record<InboxItem["kind"], { label: string; icon: typeof Globe }> = {
  website: { label: "Custom website", icon: Globe },
  job: { label: "Job application", icon: BriefcaseBusiness },
  support: { label: "Support ticket", icon: LifeBuoy },
};

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span className="adm-delta flat"><Minus size={13}/> No change vs last month</span>;
  if (previous === 0) return <span className="adm-delta up"><ArrowUpRight size={13}/> First sales this month</span>;
  const change = (current - previous) / previous;
  const Icon = change >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={`adm-delta ${change >= 0 ? "up" : "down"}`}><Icon size={13}/> {change >= 0 ? "+" : ""}{(change * 100).toFixed(1)}% vs last month</span>;
}

export function AdminOverview({ data, adminName }: { data: AdminOverviewData; adminName: string }) {
  const now = data.generatedAt;
  const thisMonth = data.revenue[data.revenue.length - 1];
  const lastMonth = data.revenue[data.revenue.length - 2];
  const sixMonthTotal = data.revenue.reduce((sum, month) => sum + month.centavos, 0);
  const axisMax = niceMax(Math.max(...data.revenue.map(month => month.centavos)));
  const ticks = [axisMax, axisMax / 2, 0];
  const mixMax = Math.max(1, ...data.projects.mix.map(row => row.count));
  const hour = Number(new Intl.DateTimeFormat("en-PH", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Manila" }).format(new Date(now)));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date(now).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Manila" });

  return <div className="adm">
    <header className="adm-topbar">
      <div>
        <p className="adm-date">{today}</p>
        <h1>{greeting}, <em>{adminName.split(" ")[0]}.</em></h1>
      </div>
      <div className="top-actions">
        <Link className="btn btn-secondary btn-small" href="/" target="_blank"><ExternalLink size={15}/> View site</Link>
        <RefreshButton/>
      </div>
    </header>

    {data.failed.length > 0 && <div className="adm-alert" role="status"><AlertTriangle size={16}/><span>Couldn’t load {data.failed.join(", ")}. Those sections may be incomplete. Check that every Supabase migration has been applied.</span></div>}

    <PaymentReview payments={data.pendingPayments}/>

    <section className="adm-hero glass" id="revenue" aria-labelledby="revenue-title">
      <div className="adm-hero-figure">
        <p className="adm-label" id="revenue-title">Revenue this month</p>
        <strong className="adm-hero-number">{peso(thisMonth.centavos)}</strong>
        <Delta current={thisMonth.centavos} previous={lastMonth.centavos}/>
        <dl className="adm-hero-meta">
          <div><dt>Paid orders</dt><dd>{data.paidOrdersThisMonth}</dd></div>
          <div><dt>Last 6 months</dt><dd>{peso(sixMonthTotal)}</dd></div>
        </dl>
        <p className="fine">Confirmed payments only, in Manila time.</p>
      </div>
      <figure className="adm-chart" aria-label="Monthly revenue, last six months">
        <div className="adm-chart-plot">
          <div className="adm-chart-grid" aria-hidden="true">{ticks.map(tick => <span key={tick}><em>{compactPeso(tick)}</em></span>)}</div>
          <div className="adm-chart-cols">
            {data.revenue.map((month, index) => {
              const current = index === data.revenue.length - 1;
              const style = { "--h": `${(month.centavos / axisMax) * 100}%` } as React.CSSProperties;
              return <div className={`adm-col ${current ? "current" : ""}`} key={month.key} style={style} tabIndex={0} aria-label={`${month.label}: ${peso(month.centavos)} from ${month.orders} paid ${month.orders === 1 ? "order" : "orders"}`}>
                {current && month.centavos > 0 && <span className="adm-col-value">{compactPeso(month.centavos)}</span>}
                <span className="adm-col-bar"/>
                <span className="adm-tooltip" role="tooltip"><b>{month.label}</b>{peso(month.centavos)}<small>{month.orders} paid {month.orders === 1 ? "order" : "orders"}</small></span>
              </div>;
            })}
          </div>
        </div>
        <div className="adm-chart-x" aria-hidden="true">{data.revenue.map(month => <span key={month.key}>{month.label}</span>)}</div>
        <details className="adm-table-toggle">
          <summary>View as table</summary>
          <table className="data-table compact"><thead><tr><th>Month</th><th>Paid orders</th><th>Revenue</th></tr></thead><tbody>{data.revenue.map(month => <tr key={month.key}><td>{month.label}</td><td>{month.orders}</td><td>{peso(month.centavos)}</td></tr>)}</tbody></table>
        </details>
      </figure>
    </section>

    <section className="adm-stats" aria-label="Key numbers">
      <article className="adm-stat glass"><p className="adm-label"><Users size={15}/> Customers</p><strong>{data.customers.total.toLocaleString("en-PH")}</strong><span>+{data.customers.newThisMonth} joined this month</span></article>
      <article className="adm-stat glass"><p className="adm-label"><FileStack size={15}/> Projects</p><strong>{data.projects.total.toLocaleString("en-PH")}</strong><span>{data.projects.published} published</span></article>
      <article className="adm-stat glass"><p className="adm-label"><Inbox size={15}/> New requests</p><strong>{data.openRequests}</strong><span>Inquiries and tickets awaiting a reply</span></article>
    </section>

    <section className="content-grid adm-row">
      <div className="panel glass" id="requests">
        <div className="panel-head"><h2>Requests inbox</h2><span className="fine">Newest first</span></div>
        {data.inbox.length === 0 ? <div className="adm-empty"><Inbox size={22}/><p>You’re all caught up. New inquiries and support tickets will appear here.</p></div> :
          <ul className="adm-inbox">{data.inbox.map(item => {
            const { label, icon: Icon } = inboxKinds[item.kind];
            return <li key={`${item.kind}-${item.id}`}>
              <span className="adm-inbox-icon"><Icon size={16}/></span>
              <div><p className="adm-inbox-kind">{label} · {timeAgo(item.createdAt, now)}</p><h3>{item.title}</h3><p>{item.detail}</p></div>
              <div className="adm-inbox-side"><span className={`status-pill ${item.status}`}>{item.status}</span>{item.email && <a className="icon-button adm-mail" href={`mailto:${item.email}`} aria-label={`Email ${item.title}`}><Mail size={15}/></a>}</div>
            </li>;
          })}</ul>}
      </div>
      <aside className="panel glass" id="projects">
        <div className="panel-head"><h2>Projects by type</h2><span className="fine">Published / total</span></div>
        <ul className="adm-mix">{data.projects.mix.map(row => <li key={row.label}>
          <div className="adm-mix-label"><span>{row.label}</span><b>{row.published} / {row.count}</b></div>
          <span className="adm-meter" role="img" aria-label={`${row.label}: ${row.published} published of ${row.count}`}><i style={{ width: `${(row.count / mixMax) * 100}%` }}><i style={{ width: row.count ? `${(row.published / row.count) * 100}%` : 0 }}/></i></span>
        </li>)}</ul>
        <p className="adm-legend" aria-hidden="true"><span><i className="published"/> Published</span><span><i/> Draft</span></p>
      </aside>
    </section>

    <section className="content-grid adm-row">
      <div className="panel glass" id="orders">
        <div className="panel-head"><h2>Recent orders</h2></div>
        {data.recentOrders.length === 0 ? <div className="adm-empty"><Inbox size={22}/><p>No orders yet. They’ll show up here once customers check out.</p></div> :
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Reference</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead><tbody>{data.recentOrders.map(order => <tr key={order.id}><td><strong>{order.reference}</strong></td><td>{order.customer}</td><td>{shortDate(order.createdAt)}</td><td><span className={`status-pill ${order.status}`}>{order.status.replace("_", " ")}</span></td><td className="num">{peso(order.totalCentavos)}</td></tr>)}</tbody></table></div>}
      </div>
      <aside className="panel glass" id="customers">
        <div className="panel-head"><h2>Newest customers</h2><Users size={17}/></div>
        {data.recentCustomers.length === 0 ? <div className="adm-empty"><Users size={22}/><p>No sign-ups yet.</p></div> :
          <ul className="adm-people">{data.recentCustomers.map(person => <li key={person.id}><span className="avatar">{initials(person.name)}</span><div><h3>{person.name}</h3><p>Joined {timeAgo(person.createdAt, now)} · {person.projects} {person.projects === 1 ? "project" : "projects"}</p></div></li>)}</ul>}
      </aside>
    </section>

    <section className="panel glass adm-row" id="templates">
      <div className="panel-head"><h2>Templates</h2><span className="fine">Managed in Supabase</span></div>
      {data.templates.length === 0 ? <div className="adm-empty"><FileStack size={22}/><p>No templates in the database yet. The built-in wedding, debut, and business designs don’t need a template record.</p></div> :
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Template</th><th>Category</th><th>Status</th><th>Updated</th><th className="num">Price</th></tr></thead><tbody>{data.templates.map(template => <tr key={template.id}><td><strong>{template.name}</strong></td><td>{template.category}</td><td><span className={`status-pill ${template.status}`}>{template.status}</span></td><td>{shortDate(template.updatedAt)}</td><td className="num">{template.priceCentavos ? peso(template.priceCentavos) : "Free"}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
