"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function WelcomePage() {
  const [userName, setUserName] = useState("there");
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
      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.onboarding_complete) window.location.href = "/onboarding";
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString("en-CA");
      const res = await fetch(`/api/meals/day-summary?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSummary(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const macros = [
    { label: "Protein", value: Math.round(summary.protein), unit: "g" },
    { label: "Carbs", value: Math.round(summary.carbs), unit: "g" },
    { label: "Fat", value: Math.round(summary.fat), unit: "g" },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
      {/* Greeting */}
      <div className="pt-2">
        <p className="text-sm text-muted mb-1">{greeting}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{userName}</h1>
      </div>

      {/* Today's snapshot */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <span className="text-xs font-medium text-muted uppercase tracking-wider">Today</span>
        </div>
        <div className="grid grid-cols-4 divide-x divide-border">
          <div className="px-5 py-5">
            <p className="text-xs text-muted mb-1.5">Calories</p>
            <p className="text-2xl font-semibold tracking-tight">{Math.round(summary.calories)}</p>
            <p className="text-xs text-subtle mt-0.5">kcal</p>
          </div>
          {macros.map((m) => (
            <div key={m.label} className="px-5 py-5">
              <p className="text-xs text-muted mb-1.5">{m.label}</p>
              <p className="text-2xl font-semibold tracking-tight">{m.value}</p>
              <p className="text-xs text-subtle mt-0.5">{m.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/log-meals"
          className="group flex items-center justify-between bg-foreground text-white rounded-xl px-6 py-5 transition-all hover:bg-zinc-800"
        >
          <div>
            <p className="font-medium text-sm">Log a meal</p>
            <p className="text-xs text-zinc-400 mt-0.5">Add foods to today's diary</p>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/dashboard"
          className="group flex items-center justify-between bg-white border border-border rounded-xl px-6 py-5 transition-all hover:border-border-strong hover:bg-surface-raised"
        >
          <div>
            <p className="font-medium text-sm text-foreground">View dashboard</p>
            <p className="text-xs text-muted mt-0.5">Goals, trends and progress</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/create-meal"
          className="group flex items-center justify-between bg-white border border-border rounded-xl px-6 py-5 transition-all hover:border-border-strong hover:bg-surface-raised"
        >
          <div>
            <p className="font-medium text-sm text-foreground">Create a meal</p>
            <p className="text-xs text-muted mt-0.5">Build and save meal templates</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
