// Small stat/metric card used across every dashboard.
export default function StatCard({ icon: Icon, label, value, change, tone = 'up', sub }) {
  return (
    <div className="card card-pad stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon">
          {Icon && <Icon size={18} />}
        </div>
        {change && (
          <span className={`stat-card-change ${tone}`}>
            {tone === 'up' ? '↗' : '↘'} {change}
          </span>
        )}
      </div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
      </div>
    </div>
  )
}
