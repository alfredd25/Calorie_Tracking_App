"use client";
import React, { useState, useEffect } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import Link from "next/link";

export function DashboardWeightCard({ targetWeight }: { targetWeight?: number | null }) {
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

  const today = new Date().toLocaleDateString("en-CA");
  const todayLog = history.find((l) => l.date === today);
  const previousLogs = history.filter((l) => l.date !== today);
  const yesterdayLog = previousLogs.length > 0 ? previousLogs[previousLogs.length - 1] : null;

  const change = todayLog && yesterdayLog ? todayLog.weight_kg - yesterdayLog.weight_kg : 0;

  return (
    <div className="bg-white border border-border rounded-xl p-6 h-full flex flex-col">
      <p className="text-xs font-medium text-muted uppercase tracking-wider mb-4">Weight</p>

      <div className="flex-1 flex flex-col justify-center">
        {todayLog ? (
          <div className="space-y-4">
            <div>
              <span className="text-4xl font-semibold tracking-tight">
                {todayLog.weight_kg.toFixed(1)}
              </span>
              <span className="text-sm text-muted ml-1.5">kg</span>
            </div>

            {yesterdayLog ? (
              <div className="flex items-center gap-1.5 text-sm">
                {change < 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-green-700">{Math.abs(change).toFixed(1)} kg down</span>
                  </>
                ) : change > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700">{change.toFixed(1)} kg up</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-3.5 h-3.5 text-muted" />
                    <span className="text-muted">No change</span>
                  </>
                )}
                <span className="text-subtle">from last entry</span>
              </div>
            ) : (
              <p className="text-sm text-muted">First entry logged.</p>
            )}

            {targetWeight && (
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Target</span>
                  <span className="font-medium">{targetWeight.toFixed(1)} kg</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted">Remaining</span>
                  <span className="font-medium">
                    {Math.abs(todayLog.weight_kg - targetWeight).toFixed(1)} kg
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted mb-4">No weight logged today</p>
            <Link
              href="/log-meals"
              className="inline-block text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted transition-colors"
            >
              Log now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
