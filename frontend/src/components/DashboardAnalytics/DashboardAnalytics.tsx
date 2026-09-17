import { useMemo, type ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { TrackedApplication } from '../../types/job';
import {
  getApplicationsOverTime,
  getPipelineCounts,
  getSourceBreakdown,
} from '../../utils/applicationAnalytics';
import styles from './DashboardAnalytics.module.scss';

interface DashboardAnalyticsProps {
  items: TrackedApplication[];
}

function ChartCard({
  title,
  description,
  children,
  empty,
}: {
  title: string;
  description: string;
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <article className={styles.chartCard}>
      <header className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        <p className={styles.chartDescription}>{description}</p>
      </header>
      <div className={styles.chartBody}>
        {empty ? <p className={styles.chartEmpty}>Not enough data yet</p> : children}
      </div>
    </article>
  );
}

export function DashboardAnalytics({ items }: DashboardAnalyticsProps) {
  const pipeline = useMemo(() => getPipelineCounts(items), [items]);
  const sources = useMemo(() => getSourceBreakdown(items), [items]);
  const timeline = useMemo(() => getApplicationsOverTime(items), [items]);

  const hasPipelineData = pipeline.some((entry) => entry.count > 0);
  const hasSourceData = sources.length > 0;
  const hasTimelineData = timeline.length > 0;

  if (items.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.panelEmpty}>Track a few applications to see trends.</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.grid}>
        <ChartCard
          title="Application pipeline"
          description="Where each tracked role sits in your search."
          empty={!hasPipelineData}
        >
          {hasPipelineData && (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={pipeline}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#dde3ea" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#8b9aab', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={88}
                  tick={{ fill: '#1a2332', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(61, 90, 128, 0.06)' }}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #dde3ea',
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {pipeline.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Applications by source"
          description="Which job boards you apply through most."
          empty={!hasSourceData}
        >
          {hasSourceData && (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {sources.map((entry) => (
                    <Cell key={entry.source} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #dde3ea',
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Activity over time"
          description="Applications tracked each week."
          empty={!hasTimelineData}
        >
          {hasTimelineData && (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3d5a80" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3d5a80" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde3ea" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#8b9aab', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#8b9aab', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #dde3ea',
                    fontSize: 13,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#3d5a80"
                  strokeWidth={2}
                  fill="url(#activityFill)"
                  dot={{ fill: '#3d5a80', r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
