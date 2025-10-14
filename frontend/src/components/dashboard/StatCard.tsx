// StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  desc?: string;
}

export function StatCard({ title, value, icon, color , desc }: StatCardProps) {
  return (
    <div className={`stat bg-base-100 shadow-lg rounded-2xl border border-base-300`}>
      <img
        className={`stat-figure w-12 aspect-square`}
        src={icon}
        alt={title}
        style={{ color }}
      />
      <div className="stat-title text-base-content/70">{title}</div>
      <div className={`stat-value text-${color}`}>{value}</div>
      {desc && <div className="stat-desc text-base-content/60">{desc}</div>}
    </div>
  );
}