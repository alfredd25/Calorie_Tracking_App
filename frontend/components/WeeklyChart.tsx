"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface ChartData {
  date: string;
  calories: number;
}

export function WeeklyChart({ data }: { data: ChartData[] }) {
  const chartData = data.map((d) => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      day: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
    };
  });

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
          />
          <Tooltip
            cursor={{ fill: "#f4f4f5" }}
            contentStyle={{
              borderRadius: "6px",
              border: "1px solid #e4e4e7",
              fontSize: "12px",
              boxShadow: "0 1px 4px rgb(0 0 0 / 0.08)",
            }}
          />
          <Bar dataKey="calories" fill="#18181b" radius={[3, 3, 0, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
