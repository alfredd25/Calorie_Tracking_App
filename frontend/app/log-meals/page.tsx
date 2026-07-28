"use client";
import React, { useState, useEffect } from "react";
import { MealSection, LoggedFood } from "@/components/MealSection";
import { WeightLoggingWidget } from "@/components/WeightLoggingWidget";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

export default function LogMealsPage() {
  const [foods, setFoods] = useState<any[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const fetchMeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString("en-CA");

      const [mealsRes, sumRes] = await Promise.all([
        fetch(`/api/meals/list?date=${today}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/meals/day-summary?date=${today}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (mealsRes.ok) setFoods(await mealsRes.json());
      if (sumRes.ok) setDailyTotals(await sumRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const getLoggedFoodsForType = (type: string): LoggedFood[] => {
    const meal = foods.find((m: any) => m.meal_type === type.toLowerCase());
    if (!meal?.items) return [];
    return meal.items.map((item: any) => ({
      id: item.id,
      food_id: item.food_id,
      name: item.food?.name || "Unknown",
      grams: item.quantity,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));
  };

  const totalsData = [
    { label: "Calories", value: Math.round(dailyTotals.calories), unit: "kcal" },
    { label: "Protein",  value: Math.round(dailyTotals.protein),  unit: "g" },
    { label: "Carbs",    value: Math.round(dailyTotals.carbs),    unit: "g" },
    { label: "Fat",      value: Math.round(dailyTotals.fat),      unit: "g" },
  ];

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-400 pb-8">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">Log meals</h1>
        <p className="text-sm text-muted mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Daily totals */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 divide-x divide-border">
          {totalsData.map((t) => (
            <div key={t.label} className="px-4 py-4">
              <p className="text-xs text-muted mb-1">{t.label}</p>
              <p className="text-lg font-semibold tracking-tight">{t.value}</p>
              <p className="text-xs text-subtle">{t.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weight */}
      <WeightLoggingWidget />

      {/* Meals */}
      <div className="space-y-3">
        {MEAL_TYPES.map((type) => (
          <MealSection
            key={type}
            mealType={type}
            loggedFoods={getLoggedFoodsForType(type)}
            onMealUpdated={fetchMeals}
          />
        ))}
      </div>
    </div>
  );
}
