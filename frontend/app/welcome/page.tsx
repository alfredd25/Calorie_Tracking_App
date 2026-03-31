"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, LayoutDashboard } from "lucide-react";

export default function WelcomePage() {
  const [userName, setUserName] = useState("User");
  const [summary, setSummary] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [greeting, setGreeting] = useState("Hello");
  
  useEffect(() => {
    const name = localStorage.getItem("user_name");
    if (name) setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    fetchProfile();
    fetchSummary();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost/api/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.onboarding_complete) {
          window.location.href = "/onboarding";
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString('en-CA');
      
      const res = await fetch(`http://localhost/api/meals/day-summary?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mt-4">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          {greeting}, {userName} <span className="inline-block hover:animate-pulse">👋</span>
        </h1>
        <p className="text-lg text-slate-500 mt-2 font-medium">Let's hit your goals today and stay on track.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <p className="text-sm text-slate-500 font-medium mb-1">Calories</p>
          <p className="text-3xl font-black text-slate-800">{Math.round(summary.calories)} <span className="text-lg font-medium text-slate-400">kcal</span></p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center gap-3">
          <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
            <span>Protein</span> <span className="text-blue-600">{Math.round(summary.protein)}g</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
            <span>Carbs</span> <span className="text-yellow-600">{Math.round(summary.carbs)}g</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
            <span>Fat</span> <span className="text-purple-600">{Math.round(summary.fat)}g</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Link href="/log-meals" className="group relative overflow-hidden bg-primary text-white p-8 rounded-3xl shadow-lg shadow-green-200 transition-all hover:shadow-green-300 hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">Log a Meal</h3>
              <p className="text-green-50 font-medium">Add to your daily diary</p>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
        </Link>
        
        <Link href="/dashboard" className="group relative overflow-hidden bg-white text-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md hover:-translate-y-1">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-200 transition-colors">
              <LayoutDashboard className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">View Dashboard</h3>
              <p className="text-slate-500 font-medium">Check your progress</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
