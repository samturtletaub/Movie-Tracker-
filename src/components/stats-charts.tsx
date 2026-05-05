"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
  PieChart,
  Pie,
} from "recharts";
import type { Bucket } from "@/lib/utils";

const BUCKET_COLORS: Record<Bucket, string> = {
  loved: "#d4a574",
  liked: "#7fb28a",
  meh: "#6b6c78",
  dnf: "#d14e4e",
};

interface BucketDatum {
  name: string;
  value: number;
  bucket: Bucket;
}

export function StatsCharts({
  bucketData,
  genreData,
  decadeData,
}: {
  bucketData: BucketDatum[];
  genreData: Array<{ name: string; value: number }>;
  decadeData: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <ChartCard title="By bucket">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "#101014",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
            />
            <Pie
              data={bucketData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              stroke="transparent"
            >
              {bucketData.map((d) => (
                <Cell key={d.bucket} fill={BUCKET_COLORS[d.bucket]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Legend
          items={bucketData.map((d) => ({
            label: `${d.name} · ${d.value}`,
            color: BUCKET_COLORS[d.bucket],
          }))}
        />
      </ChartCard>

      <ChartCard title="Top genres">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={genreData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" tick={{ fill: "#a0a1ab", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#cfd0d6", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                background: "#101014",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
            />
            <Bar dataKey="value" fill="#d4a574" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="By decade" span="md:col-span-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={decadeData} margin={{ left: 20, right: 20, top: 10 }}>
            <XAxis dataKey="name" tick={{ fill: "#cfd0d6", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#a0a1ab", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: "#101014",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
                color: "#fff",
              }}
            />
            <Bar dataKey="value" fill="#d4a574" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  children,
  span,
}: {
  title: string;
  children: React.ReactNode;
  span?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-white/5 bg-white/[0.02] p-5 " + (span ?? "")
      }
    >
      <div className="mb-4 text-[11px] uppercase tracking-[0.25em] text-ink-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function Legend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-200">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
