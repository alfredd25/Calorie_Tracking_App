"use client";
import React, { useState, useEffect } from "react";
import { AnimatedRing } from "@/components/AnimatedRing";
import { WeeklyChart } from "@/components/WeeklyChart";
import { Flame } from "lucide-react";
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
    fat: profile?.target_fat || 65 
  };

  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString('en-CA');

      const headers = { Authorization: `Bearer ${token}` };

      const profileRes = await fetch(`http://localhost/api/users/me`, { headers });
      if (profileRes.ok) setProfile(await profileRes.json());

      const sumRes = await fetch(`http://localhost/api/meals/day-summary?date=${today}`, { headers });
      if (sumRes.ok) setSummary(await sumRes.json());

      const weekRes = await fetch(`http://localhost/api/meals/weekly-summary`, { headers });
      if (weekRes.ok) setWeeklyData(await weekRes.json());

      const streakRes = await fetch(`http://localhost/api/meals/streak`, { headers });
      if (streakRes.ok) {
        const streakData = await streakRes.json();
        setStreak(streakData.streak);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-end mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 font-medium">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-2 rounded-2xl border border-orange-200 shadow-sm">
          <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
          <span className="font-bold text-orange-700">{streak} day streak</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-800 mb-6 w-full text-left">Daily Goals</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 w-full justify-items-center">
            <AnimatedRing 
              progress={Math.round(summary.calories)} 
              goal={Math.round(goals.calories)} 
              label="Calories" 
              colorClass="stroke-green-500" 
            />
            <AnimatedRing 
              progress={Math.round(summary.protein)} 
              goal={Math.round(goals.protein)} 
              label="Protein" 
              colorClass="stroke-blue-500" 
              size={100} strokeWidth={8} 
            />
            <AnimatedRing 
              progress={Math.round(summary.carbs)} 
              goal={Math.round(goals.carbs)} 
              label="Carbs" 
              colorClass="stroke-yellow-500" 
              size={100} strokeWidth={8} 
            />
            <AnimatedRing 
              progress={Math.round(summary.fat)} 
              goal={Math.round(goals.fat)} 
              label="Fat" 
              colorClass="stroke-purple-500" 
              size={100} strokeWidth={8} 
            />
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <DashboardWeightCard targetWeight={profile?.target_weight_kg} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Weekly Intake</h3>
        <p className="text-sm text-slate-500 mb-4">Your calorie history over the last 7 days</p>
        {weeklyData.length > 0 ? (
          <WeeklyChart data={weeklyData} />
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Current streak data loading...
          </div>
        )}
      </div>
    </div>
  );
}