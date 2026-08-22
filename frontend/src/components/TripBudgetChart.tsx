"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

export default function TripBudgetChart({ data, currency }: { data: any, currency: string }) {
  
  const { totalBudget, totalSpend, chartData, colors, remaining } = useMemo(() => {
    let budget = 0;
    let spent = 0;
    const categories: Record<string, number> = {};

    if (data?.stops) {
      data.stops.forEach((stop: any) => {
        budget += Number(stop.stop.budget || 0);
        
        stop.activities.forEach((act: any) => {
          const cost = Number(act.item.costOverride || act.activity.cost || 0);
          spent += cost;
          
          const type = act.activity.type || "Other";
          categories[type] = (categories[type] || 0) + cost;
        });
      });
    }

    const remaining = Math.max(0, budget - spent);
    const overBudget = spent - budget;

    const chartData = Object.keys(categories).map(key => ({
      name: key,
      value: categories[key]
    }));

    if (remaining > 0) {
      chartData.push({ name: "Remaining Budget", value: remaining });
    }

    // Assign colors
    const colorMap: Record<string, string> = {
      "Remaining Budget": "#e5e7eb", // gray
      "Sightseeing": "#3b82f6", // blue
      "Food": "#f59e0b", // yellow
      "Transport": "#10b981", // green
      "Experience": "#8b5cf6", // purple
      "Other": "#ec4899", // pink
    };

    const colors = chartData.map(d => colorMap[d.name] || "#6366f1");

    return { totalBudget: budget, totalSpend: spent, chartData, colors, remaining };
  }, [data]);

  const overBudget = totalSpend > totalBudget && totalBudget > 0;

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full items-center bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
      
      {/* Left side: Stats */}
      <div className="w-full min-w-0 md:w-2/5 flex flex-col justify-center gap-6">
        <div>
          <h2 className="text-2xl font-black mb-1 text-balance">Financial Overview</h2>
          <p className="text-muted-foreground text-sm">Track your spending across all destinations.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="min-w-0 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border dark:border-zinc-800">
            <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mb-1">Total Budget</p>
            <p className="text-xl lg:text-2xl xl:text-3xl font-black text-primary tabular-nums leading-tight break-words">{currency}{totalBudget.toFixed(2)}</p>
          </div>
          
          <div className={`min-w-0 p-4 rounded-2xl border ${overBudget ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800'}`}>
            <p className="text-xs uppercase font-black tracking-widest mb-1 opacity-70">Total Spent</p>
            <p className="text-xl lg:text-2xl xl:text-3xl font-black tabular-nums leading-tight break-words">{currency}{totalSpend.toFixed(2)}</p>
            {overBudget && <p className="text-xs font-bold mt-1 uppercase">Over Budget!</p>}
          </div>
        </div>
        
        {!overBudget && totalBudget > 0 && (
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">{currency}{remaining.toFixed(2)}</Badge>
            Left in budget
          </div>
        )}
      </div>

      {/* Right side: Chart */}
      <div className="w-full md:w-2/3 h-[250px] flex items-center justify-center">
        {totalBudget === 0 && totalSpend === 0 ? (
           <div className="text-muted-foreground font-medium flex flex-col items-center">
             <div className="w-16 h-16 rounded-full border-4 border-dashed border-zinc-300 dark:border-zinc-700 mb-4" />
             Set budgets and add activities to see the breakdown.
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${currency}${Number(value).toFixed(2)}`, "Amount"]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
