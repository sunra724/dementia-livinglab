'use client';

import dynamic from 'next/dynamic';

export interface DementiaSeverityDatum {
  name: string;
  nationalAverage: number;
  localSubjects: number;
}

interface DementiaSeverityChartProps {
  data: DementiaSeverityDatum[];
}

function formatPercentValue(value: number | string | ReadonlyArray<number | string> | undefined) {
  const numericValue = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
  return `${numericValue}%`;
}

const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), {
  ssr: false,
});

const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), {
  ssr: false,
});

const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), {
  ssr: false,
});

const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), {
  ssr: false,
});

const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), {
  ssr: false,
});

const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), {
  ssr: false,
});

const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), {
  ssr: false,
});

const Legend = dynamic(() => import('recharts').then((mod) => mod.Legend), {
  ssr: false,
});

export default function DementiaSeverityChart({ data }: DementiaSeverityChartProps) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickFormatter={(value: number) => `${value}%`}
          />
          <Tooltip formatter={formatPercentValue} />
          <Legend />
          <Bar dataKey="nationalAverage" name="전국 평균" fill="#94a3b8" radius={[6, 6, 0, 0]} />
          <Bar dataKey="localSubjects" name="우리 대상자" fill="#46549C" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
