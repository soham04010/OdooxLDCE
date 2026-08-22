"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export default function AdminPieChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie 
          data={data} 
          cx="50%" 
          cy="50%" 
          innerRadius={60} 
          outerRadius={80} 
          paddingAngle={5} 
          dataKey="value" 
          nameKey="name"
          isAnimationActive={false}
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
