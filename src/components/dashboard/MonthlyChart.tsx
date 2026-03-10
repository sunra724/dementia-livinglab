'use client';

import dynamic from 'next/dynamic';

const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
);

const BarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
);

const Bar = dynamic(
  () => import('recharts').then(mod => mod.Bar),
  { ssr: false }
);

const CartesianGrid = dynamic(
  () => import('recharts').then(mod => mod.CartesianGrid),
  { ssr: false }
);

const XAxis = dynamic(
  () => import('recharts').then(mod => mod.XAxis),
  { ssr: false }
);

const YAxis = dynamic(
  () => import('recharts').then(mod => mod.YAxis),
  { ssr: false }
);

const Tooltip = dynamic(
  () => import('recharts').then(mod => mod.Tooltip),
  { ssr: false }
);

const Legend = dynamic(
  () => import('recharts').then(mod => mod.Legend),
  { ssr: false }
);

interface MonthlyChartProps {
  data: Record<string, unknown>[];
  dataKeys: string[];
  colors: string[];
  type: 'bar' | 'line' | 'area';
}

export default function MonthlyChart({
  data,
  dataKeys,
  colors,
  type,
}: MonthlyChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (type) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[index] || '#6b7280'} />
            ))}
          </BarChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      {renderChart()}
    </ResponsiveContainer>
  );
}