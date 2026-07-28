"use client";
import React, { useState, useEffect } from "react";
import { Search, Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

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
  const [results, setResults] = useState<{ id: number; name: string; calories: number }[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [grams, setGrams] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length > 2) searchFoods(query);
      else setResults([]);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const searchFoods = async (q: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/foods/autocomplete?q=${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setResults(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogFood = async () => {
    if (!selectedFood || !grams) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split("T")[0];
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      const createRes = await fetch("/api/meals/create", {
        method: "POST",
        headers,
        body: JSON.stringify({ date: today, meal_type: mealType.toLowerCase() }),
      });
      if (!createRes.ok) throw new Error("Failed to create meal");
      const mealData = await createRes.json();
      const meal_id = mealData.id || mealData.meal_id;

      const addRes = await fetch("/api/meals/add-food", {
        method: "POST",
        headers,
        body: JSON.stringify({ meal_id, food_id: selectedFood.id, quantity: Number(grams) }),
      });

      if (addRes.ok) {
        setAdded(true);
        setTimeout(() => {
          setAdded(false);
          setQuery("");
          setResults([]);
          setSelectedFood(null);
          setGrams("");
          onMealUpdated();
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFood = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/meals/remove-food/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onMealUpdated();
    } catch (e) {
      console.error(e);
    }
  };

  const totals = loggedFoods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fat: acc.fat + f.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="bg-white border border-border rounded-xl overflow-visible">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-raised transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <p className="text-sm font-medium text-foreground">{mealType}</p>
          <p className="text-xs text-muted mt-0.5">
            {Math.round(totals.calories)} kcal
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-subtle" />
        ) : (
          <ChevronDown className="w-4 h-4 text-subtle" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-border px-5 py-4 space-y-4 relative">
          {/* Search / selected food */}
          {!selectedFood ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle pointer-events-none" />
              <input
                type="text"
                placeholder="Search foods..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all"
              />
              {results.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-border rounded-lg shadow-md max-h-56 overflow-y-auto">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      className="w-full flex justify-between items-center px-4 py-2.5 hover:bg-surface-raised text-sm text-left border-b border-border last:border-0 transition-colors"
                      onClick={() => {
                        setSelectedFood(r);
                        setResults([]);
                        setQuery("");
                      }}
                    >
                      <span className="text-foreground">{r.name}</span>
                      <span className="text-xs text-muted ml-3 shrink-0">
                        {Math.round(r.calories)} kcal/100g
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-surface-raised rounded-lg px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedFood.name}</p>
                <p className="text-xs text-muted">{Math.round(selectedFood.calories)} kcal / 100g</p>
              </div>
              <input
                type="number"
                placeholder="g"
                value={grams}
                onChange={(e) => setGrams(e.target.value ? Number(e.target.value) : "")}
                className="w-20 px-2.5 py-1.5 border border-border rounded-md text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all"
              />
              <button
                onClick={handleLogFood}
                disabled={loading || !grams || added}
                className="shrink-0 bg-foreground text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-40 transition-colors hover:bg-zinc-700 flex items-center gap-1"
              >
                {loading ? (
                  <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                ) : added ? (
                  "Added"
                ) : (
                  <>
                    <Plus className="w-3 h-3" /> Add
                  </>
                )}
              </button>
              <button
                onClick={() => { setSelectedFood(null); setGrams(""); }}
                className="text-subtle hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Food list */}
          {loggedFoods.length === 0 ? (
            <p className="text-sm text-subtle text-center py-3">Nothing logged yet</p>
          ) : (
            <div className="space-y-1">
              {loggedFoods.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{f.name}</p>
                    <p className="text-xs text-muted">
                      {f.grams}g &middot; {Math.round(f.calories)} kcal
                    </p>
                  </div>
                  <div className="hidden sm:flex gap-3 text-xs text-subtle shrink-0">
                    <span>P {Math.round(f.protein)}g</span>
                    <span>C {Math.round(f.carbs)}g</span>
                    <span>F {Math.round(f.fat)}g</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFood(f.id)}
                    className="opacity-0 group-hover:opacity-100 text-subtle hover:text-red-500 transition-all p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Meal totals */}
          {loggedFoods.length > 0 && (
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted">
              <span className="font-medium text-foreground">
                {Math.round(totals.calories)} kcal
              </span>
              <div className="flex gap-3">
                <span>P {Math.round(totals.protein)}g</span>
                <span>C {Math.round(totals.carbs)}g</span>
                <span>F {Math.round(totals.fat)}g</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
