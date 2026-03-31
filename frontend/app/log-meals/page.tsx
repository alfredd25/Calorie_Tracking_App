"use client";
import React, { useState, useEffect } from "react";
import { MealSection, LoggedFood } from "@/components/MealSection";
import { WeightLoggingWidget } from "@/components/WeightLoggingWidget";

export default function LogMealsPage() {
  const [foods, setFoods] = useState<any[]>([]);
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

  const fetchMeals = async () => {
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toLocaleDateString('en-CA');

      const res = await fetch(`http://localhost/api/meals/list?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      }

      const summaryRes = await fetch(`http://localhost/api/meals/day-summary?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setDailyTotals(sumData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const getLoggedFoodsForType = (type: string): LoggedFood[] => {
    const meal = foods.find((m: any) => m.meal_type === type.toLowerCase());
    if (!meal || !meal.items) return [];
    return meal.items.map((item: any) => ({
      id: item.id,
      food_id: item.food_id,
      name: item.food?.name || "Unknown Food",
      grams: item.quantity,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    }));
  };

  // Totals are fetched from the server.

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Log Meals</h1>
        <p className="text-slate-500 font-medium">Add your foods for today</p>
      </div>
      
      <WeightLoggingWidget />

      <div className="space-y-4">
        {mealTypes.map(type => (
          <MealSection
            key={type}
            mealType={type}
            loggedFoods={getLoggedFoodsForType(type)}
            onMealUpdated={fetchMeals}
          />
        ))}
      </div>

      <div className="mt-8 bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 text-white">
        <h3 className="text-lg font-bold mb-4">Today's Total</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Calories</span>
            <span className="text-xl md:text-2xl font-black text-green-400">{Math.round(dailyTotals.calories)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Protein</span>
            <span className="text-lg md:text-xl font-bold">{Math.round(dailyTotals.protein)}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Carbs</span>
            <span className="text-lg md:text-xl font-bold">{Math.round(dailyTotals.carbs)}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] md:text-xs uppercase font-bold tracking-wider mb-1">Fat</span>
            <span className="text-lg md:text-xl font-bold">{Math.round(dailyTotals.fat)}g</span>
          </div>
        </div>
      </div>
    </div>
  );
}
