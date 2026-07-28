"use client";
import React, { useState, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
      const res = await fetch("/api/weight/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setHistory(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString("en-CA");
      const finalWeightKg =
        weightMode === "kg" ? Number(weightInput) : Number(weightInput) * 0.453592;

      const res = await fetch("/api/weight/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: today, weight_kg: finalWeightKg }),
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

  const displayWeight = (kg: number) =>
    weightMode === "kg" ? kg.toFixed(1) : (kg / 0.453592).toFixed(1);

  return (
    <div className="bg-white border border-border rounded-xl p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">Weight</p>

        <div className="flex bg-surface-raised rounded-md p-0.5 text-xs">
          {(["kg", "lbs"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setWeightMode(unit)}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                weightMode === unit
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          placeholder={weightMode === "kg" ? "70.5" : "155.0"}
          value={weightInput}
          onChange={(e) => setWeightInput(Number(e.target.value) || "")}
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all"
        />
        <button
          onClick={handleLogWeight}
          disabled={loading || !weightInput}
          className="bg-foreground text-white text-sm font-medium px-4 rounded-lg disabled:opacity-40 transition-colors hover:bg-zinc-700 flex items-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log"}
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium text-subtle uppercase tracking-wider mb-2">
            Recent
          </p>
          <div className="flex items-end gap-1 h-16">
            {history.slice(-7).map((log, index) => {
              const recentLogs = history.slice(-7).map((l) => l.weight_kg);
              const minLog = Math.min(...recentLogs) - 1;
              const maxLog = Math.max(...recentLogs) + 1;
              const range = maxLog - minLog || 1;
              const heightPct = Math.max(15, ((log.weight_kg - minLog) / range) * 100);
              const prevLog = index > 0 ? recentLogs[index - 1] : log.weight_kg;
              const diff = log.weight_kg - prevLog;

              return (
                <div
                  key={log.id}
                  className="flex flex-col items-center flex-1 gap-0.5 group relative"
                  title={`${displayWeight(log.weight_kg)} ${weightMode}`}
                >
                  <div
                    className={`w-full rounded-sm transition-all duration-300 ${
                      index === history.slice(-7).length - 1
                        ? "bg-foreground"
                        : "bg-border"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  {index > 0 && (
                    <span className="text-[9px] text-subtle">
                      {diff < 0 ? (
                        <TrendingDown className="w-2.5 h-2.5 text-green-600" />
                      ) : diff > 0 ? (
                        <TrendingUp className="w-2.5 h-2.5 text-amber-500" />
                      ) : (
                        <Minus className="w-2.5 h-2.5 text-subtle" />
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
