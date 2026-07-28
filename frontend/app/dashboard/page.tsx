"use client";
import React, { useState, useEffect } from "react";
import { AnimatedRing } from "@/components/AnimatedRing";
import { WeeklyChart } from "@/components/WeeklyChart";
import { DashboardWeightCard } from "@/components/DashboardWeightCard";

export default function DashboardPage() {
  const [summary, setSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [streak, setStreak] = useState(0);
  const [todayStr, setTodayStr] = useState("");
  const [profile, setProfile] = useState<any>(null);

  const goals = {
    calories: profile?.daily_calorie_target || 2000,
    protein: profile?.target_protein || 150,
    carbs: profile?.target_carbs || 200,
    fat: profile?.target_fat || 65,
  };

  useEffect(() => {
    setTodayStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString("en-CA");
      const headers = { Authorization: `Bearer ${token}` };

      const profileRes = await fetch(`/api/users/me`, { headers });
      if (profileRes.ok) setProfile(await profileRes.json());

      const sumRes = await fetch(`/api/meals/day-summary?date=${today}`, { headers });
      if (sumRes.ok) setSummary(await sumRes.json());

      const weekRes = await fetch(`/api/meals/weekly-summary`, { headers });
      if (weekRes.ok) setWeeklyData(await weekRes.json());

      const streakRes = await fetch(`/api/meals/streak`, { headers });
      if (streakRes.ok) {
        const d = await streakRes.json();
        setStreak(d.streak);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const ringData = [
    { label: "Calories", progress: Math.round(summary.calories), goal: Math.round(goals.calories), colorClass: "stroke-green-600" },
    { label: "Protein",  progress: Math.round(summary.protein),  goal: Math.round(goals.protein),  colorClass: "stroke-sky-500" },
    { label: "Carbs",    progress: Math.round(summary.carbs),    goal: Math.round(goals.carbs),    colorClass: "stroke-amber-500" },
    { label: "Fat",      progress: Math.round(summary.fat),      goal: Math.round(goals.fat),      colorClass: "stroke-violet-500" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-400 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">{todayStr}</p>
        </div>
        {streak > 0 && (
          <div className="text-right">
            <p className="text-2xl font-semibold tracking-tight">{streak}</p>
            <p className="text-xs text-muted">day streak</p>
          </div>
        )}
      </div>

      {/* Goals + Weight */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Macro rings */}
        <div className="md:col-span-2 bg-white border border-border rounded-xl p-6">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-6">Daily goals</p>
          <div className="grid grid-cols-4 gap-4 justify-items-center">
            {ringData.map((r) => (
              <AnimatedRing key={r.label} {...r} />
            ))}
          </div>
        </div>

        {/* Weight */}
        <div className="md:col-span-1">
          <DashboardWeightCard targetWeight={profile?.target_weight_kg} />
        </div>
      </div>

      {/* Weekly chart */}
      <div className="bg-white border border-border rounded-xl p-6">
        <div className="mb-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Weekly intake</p>
          <p className="text-sm text-muted mt-1">Calories over the last 7 days</p>
        </div>
        {weeklyData.length > 0 ? (
          <WeeklyChart data={weeklyData} />
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-subtle border border-dashed border-border rounded-lg">
            No data yet
          </div>
        )}
      </div>
    </div>
  );
}
