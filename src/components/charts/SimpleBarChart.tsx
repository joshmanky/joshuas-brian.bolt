// SimpleBarChart: lightweight bar chart using Recharts
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface SimpleBarChartProps {
  data: { name: string; value: number; color?: string }[];
  color?: string;
  height?: number;
}

export default function SimpleBarChart({ data, color = '#b8f94a', height = 200 }: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <XAxis
          dataKey="name"
          tick={{ fill: '#8a8a8e', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: '#131316',
            border: '1px solid #1e1e23',
            borderRadius: 8,
            fontSize: 12,
            color: '#f2f2f3',
          }}
          cursor={{ fill: 'rgba(184, 249, 74, 0.05)' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
