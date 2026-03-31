"use client";
import React, { useState, useEffect } from "react";
import { Scale, TrendingDown, TrendingUp, Minus, Target } from "lucide-react";
import Link from "next/link";

export function DashboardWeightCard({ targetWeight }: { targetWeight?: number | null }) {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost/api/weight/history", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const today = new Date().toLocaleDateString('en-CA');
  const todayLog = history.find(l => l.date === today);
  const previousLogs = history.filter(l => l.date !== today);
  const yesterdayLog = previousLogs.length > 0 ? previousLogs[previousLogs.length - 1] : null;

  const change = todayLog && yesterdayLog ? todayLog.weight_kg - yesterdayLog.weight_kg : 0;
  const changeText = Math.abs(change).toFixed(1) + " kg";

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <Scale className="w-5 h-5 mr-2 text-primary" />
          Weight Tracking
        </h3>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        {todayLog ? (
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-4xl font-black text-slate-900">{todayLog.weight_kg.toFixed(1)}</span>
              <span className="text-lg font-bold text-slate-400 mb-1">kg</span>
            </div>
            
            {yesterdayLog ? (
              <div className="flex items-center text-sm font-bold">
                {change < 0 ? (
                  <span className="text-green-500 flex items-center bg-green-50 px-2 py-1 rounded-lg">
                    <TrendingDown className="w-4 h-4 mr-1" /> ▼ {changeText}
                  </span>
                ) : change > 0 ? (
                  <span className="text-orange-500 flex items-center bg-orange-50 px-2 py-1 rounded-lg">
                    <TrendingUp className="w-4 h-4 mr-1" /> ▲ {changeText}
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center bg-slate-50 px-2 py-1 rounded-lg">
                    <Minus className="w-4 h-4 mr-1" /> No change
                  </span>
                )}
                <span className="text-slate-400 ml-2 font-medium">from last log</span>
              </div>
            ) : (
              <p className="text-sm text-slate-400 font-medium">First log! Keep it up 🔥</p>
            )}
            
            {targetWeight && (
               <div className="mt-4 pt-4 border-t border-slate-100 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                     <Target className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Goal</p>
                    <p className="text-sm font-bold text-slate-700">{targetWeight.toFixed(1)} kg</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Left</p>
                    <p className="text-sm font-bold text-blue-600">{Math.abs(todayLog.weight_kg - targetWeight).toFixed(1)} kg</p>
                  </div>
               </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Scale className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium mb-4">You haven't logged your weight today.</p>
            <Link href="/log-meals" className="inline-block bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm shadow-md shadow-green-200 hover:bg-green-600 transition-colors">
              Log Weight →
            </Link>
          </div>
        )}
      </div>

      <div className="absolute right-[-20%] bottom-[-20%] w-64 h-64 bg-slate-50 rounded-full opacity-50 blur-3xl group-hover:bg-green-50 transition-colors duration-700 pointer-events-none" />
    </div>
  );
}
