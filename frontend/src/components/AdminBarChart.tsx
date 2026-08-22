"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminBarChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 30, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <Bar dataKey="visits" name="Visits" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} minPointSize={5} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
