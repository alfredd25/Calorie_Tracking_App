"use client";
import React, { useState, useEffect } from "react";
import { Scale, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

export function WeightLoggingWidget({ onLog }: { onLog?: () => void }) {
  const [weightMode, setWeightMode] = useState<"kg" | "lbs">("kg");
  const [weightInput, setWeightInput] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
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

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString('en-CA');
      
      const finalWeightKg = weightMode === "kg" ? Number(weightInput) : Number(weightInput) * 0.453592;

      const res = await fetch("http://localhost/api/weight/log", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: today, weight_kg: finalWeightKg })
      });

      if (res.ok) {
        setWeightInput("");
        await fetchHistory();
        if (onLog) onLog();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) return <TrendingDown className="w-3 h-3 text-green-500" />;
    if (current > previous) return <TrendingUp className="w-3 h-3 text-orange-500" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  const displayWeight = (kg: number) => {
    return weightMode === "kg" ? kg.toFixed(1) : (kg / 0.453592).toFixed(1);
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <Scale className="w-5 h-5 mr-2 text-primary" />
          Today's Weight
        </h3>
        
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setWeightMode("kg")} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${weightMode === "kg" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>kg</button>
          <button onClick={() => setWeightMode("lbs")} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${weightMode === "lbs" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>lbs</button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input 
          type="number" 
          step="0.1"
          placeholder={`e.g. ${weightMode === "kg" ? "70.5" : "155.0"}`}
          value={weightInput}
          onChange={(e) => setWeightInput(Number(e.target.value) || "")}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
        <button 
          onClick={handleLogWeight}
          disabled={loading || !weightInput}
          className="bg-primary hover:bg-green-600 disabled:opacity-50 text-white font-bold px-5 rounded-xl transition-colors shadow-md shadow-green-200 flex items-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Weight"}
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Last 7 Days</h4>
          <div className="flex justify-between items-end h-24 gap-1">
            {history.slice(-7).map((log, index) => {
              // Very simple sparkline logic relative to min/max of the recent dataset
              const recentLogs = history.slice(-7).map(l => l.weight_kg);
              const minLog = Math.min(...recentLogs) - 2;
              const maxLog = Math.max(...recentLogs) + 2;
              const range = maxLog - minLog || 1;
              const heightPct = Math.max(10, ((log.weight_kg - minLog) / range) * 100);
              const prevLog = index > 0 ? recentLogs[index - 1] : log.weight_kg;
              
              const dateObj = new Date(log.date);
              const dayStr = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: 'UTC' });

              return (
                <div key={log.id} className="flex flex-col items-center flex-1 group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                    {displayWeight(log.weight_kg)} {weightMode}
                  </div>
                  <div className="w-full bg-slate-100 rounded-t-sm flex items-end justify-center">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-500 flex justify-center items-start pt-1 ${index === history.length - 1 ? 'bg-primary/80' : 'bg-slate-200'}`} 
                      style={{ height: `${heightPct}%` }}
                    >
                      {getTrendIcon(log.weight_kg, prevLog)}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1">{dayStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
