// SimpleLineChart: lightweight line chart using Recharts
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SimpleLineChartProps {
  data: { name: string; value: number }[];
  color?: string;
  height?: number;
}

export default function SimpleLineChart({ data, color = '#b8f94a', height = 200 }: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
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
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
