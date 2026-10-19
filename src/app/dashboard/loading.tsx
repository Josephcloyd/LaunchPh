export default function DashboardLoading() {
  return <div className="workspace-page" aria-label="Loading workspace"><div className="workspace-header-skeleton"><i/><i/></div><div className="summary-skeleton"/><div className="table-skeleton">{Array.from({length:5}, (_, index) => <i key={index}/>)}</div></div>;
}
