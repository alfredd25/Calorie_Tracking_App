"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDaySummary } from "@/services/api";
import { MealSummary } from "@/types/food";
import { getUserId, isLoggedIn, logout } from "@/services/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<MealSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchSummary();
  }, []);

  async function fetchSummary() {
    setLoading(true);
    setError("");
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Not logged in");
      const data = await getDaySummary(userId, today);
      setSummary(data);
    } catch (err: any) {
      if (err.detail === "No data for this date") {
        setSummary(null);
        setError("No meals logged today yet.");
      } else {
        setError("Failed to load summary.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-slate-400">{today}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/meals")}>
              Log Meal
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Macro Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Macros</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-slate-400 text-sm">Loading...</p>}
            {error && <p className="text-slate-400 text-sm">{error}</p>}
            {summary && (
              <div className="grid grid-cols-2 gap-4">
                <MacroTile
                  label="Calories"
                  value={summary.calories}
                  unit="kcal"
                  color="text-orange-500"
                />
                <MacroTile
                  label="Protein"
                  value={summary.protein}
                  unit="g"
                  color="text-blue-500"
                />
                <MacroTile
                  label="Carbs"
                  value={summary.carbs}
                  unit="g"
                  color="text-green-500"
                />
                <MacroTile
                  label="Fat"
                  value={summary.fat}
                  unit="g"
                  color="text-yellow-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function MacroTile({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 text-center">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>
        {value?.toFixed(1)}
      </p>
      <p className="text-xs text-slate-400">{unit}</p>
    </div>
  );
}