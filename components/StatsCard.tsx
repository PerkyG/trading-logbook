'use client';

interface StatsCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'default' | 'positive' | 'negative' | 'neutral';
}

export default function StatsCard({ label, value, subtext, color = 'default' }: StatsCardProps) {
  const colorClass = {
    default: 'text-white',
    positive: 'stat-positive',
    negative: 'stat-negative',
    neutral: 'text-gray-400',
  }[color];

  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-bold ${colorClass}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}
