"use client";
import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "./ui/card";

export interface LoggedFood {
  id: number;
  food_id: number;
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealSectionProps {
  mealType: string;
  loggedFoods: LoggedFood[];
  onMealUpdated: () => void;
}

export function MealSection({ mealType, loggedFoods, onMealUpdated }: MealSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: number, name: string, calories: number }[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [grams, setGrams] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 2) {
        searchFoods(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const searchFoods = async (q: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/foods/autocomplete?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [successMsg, setSuccessMsg] = useState(false);

  const handleLogFood = async () => {
    if (!selectedFood || !grams) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];
      
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const createRes = await fetch("/api/meals/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          date: today,
          meal_type: mealType.toLowerCase()
        })
      });

      if (!createRes.ok) throw new Error("Failed to create meal");
      const mealData = await createRes.json();
      const meal_id = mealData.id || mealData.meal_id;

      const addRes = await fetch("/api/meals/add-food", {
        method: "POST",
        headers,
        body: JSON.stringify({
          meal_id: meal_id,
          food_id: selectedFood.id,
          quantity: Number(grams)
        })
      });

      if (addRes.ok) {
        setSuccessMsg(true);
        setTimeout(() => {
          setSuccessMsg(false);
          setQuery("");
          setResults([]);
          setSelectedFood(null);
          setGrams("");
          onMealUpdated();
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFood = async (mealItemId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/meals/remove-food/${mealItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onMealUpdated();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totals = loggedFoods.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    protein: acc.protein + curr.protein,
    carbs: acc.carbs + curr.carbs,
    fat: acc.fat + curr.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <Card className="mb-6 overflow-visible">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer border-b border-white/5 bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-t-2xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{mealType}</h3>
          <p className="text-sm text-slate-500">{Math.round(totals.calories)} kcal</p>
        </div>
        <div>
          {isOpen ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
        </div>
      </div>
      
      {isOpen && (
        <CardContent className="p-4 pt-4 relative">
          {!selectedFood ? (
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search for a food..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-white"
              />
              
              {results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {results.map((r, idx) => (
                    <div 
                      key={idx}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center bg-white border-b border-slate-100 last:border-0"
                      onClick={() => { setSelectedFood(r); setResults([]); setQuery(""); }}
                    >
                      <span className="text-sm font-medium text-slate-700">{r.name}</span>
                      <span className="text-xs text-slate-500">{Math.round(r.calories)} kcal/100g</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 mb-4 p-4 bg-green-50 rounded-xl border border-green-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-green-900">{selectedFood.name}</p>
                  <p className="text-xs text-green-600">{Math.round(selectedFood.calories)} kcal/100g</p>
                </div>
                <button
                  onClick={() => { setSelectedFood(null); setGrams(""); }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  placeholder="grams"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value ? Number(e.target.value) : "")}
                  className="w-24 px-3 py-2 border border-green-200 rounded-lg text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 bg-white font-medium"
                />
                <button
                  onClick={handleLogFood}
                  disabled={loading || !grams || successMsg}
                  className="flex-1 bg-primary hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : successMsg ? (
                    "Food Added!"
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add to {mealType}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 mt-4">
            {loggedFoods.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No foods logged yet.</p>
            ) : (
              loggedFoods.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-500">{f.grams}g • {Math.round(f.calories)} kcal</p>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-slate-500 mr-4">
                    <span>P: {Math.round(f.protein)}</span>
                    <span>C: {Math.round(f.carbs)}</span>
                    <span>F: {Math.round(f.fat)}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveFood(f.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {loggedFoods.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs font-medium text-slate-600 gap-4 bg-slate-50 p-3 rounded-xl">
              <span className="text-primary font-bold">Total: {Math.round(totals.calories)} kcal</span>
              <div className="flex gap-4">
                <span>Pro: {Math.round(totals.protein)}g</span>
                <span>Carb: {Math.round(totals.carbs)}g</span>
                <span>Fat: {Math.round(totals.fat)}g</span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
