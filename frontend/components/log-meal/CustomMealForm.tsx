"use client";

import { autocompleteFoods } from "@/services/api";
import {
  CustomFood,
  CustomMeal,
  CustomMealInput,
  CustomMealItemInput,
  FoodSource,
} from "@/types/custom";
import { Food } from "@/types/food";
import { Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface CustomMealFormProps {
  initial?: CustomMeal | null;
  customFoods: CustomFood[];
  onSubmit: (input: CustomMealInput) => void | Promise<void>;
  submitLabel?: string;
}

interface DraftItem extends CustomMealItemInput {
  // local-only: raw string for the quantity input so users can backspace/clear it
  _qty: string;
  _name: string;
  _calories: number;
  _protein: number;
  _carbs: number;
  _fat: number;
  // base values per 1 unit (1 serving for custom, 100g for database)
  _baseCalories: number;
  _baseProtein: number;
  _baseCarbs: number;
  _baseFat: number;
}

const SOURCES: { id: FoodSource; label: string }[] = [
  { id: "custom", label: "My Foods" },
  { id: "database", label: "Database" },
];

const NUMERIC_RE = /^(\d+\.?\d*|\.\d*)?$/;

function parseQty(value: string): number {
  if (value === "" || value === ".") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function CustomMealForm({
  initial,
  customFoods,
  onSubmit,
  submitLabel = "Save meal",
}: CustomMealFormProps) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [source, setSource] = useState<FoodSource>("custom");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);

  const customFoodMap = useMemo(() => {
    const m = new Map<number, CustomFood>();
    customFoods.forEach((f) => m.set(f.id, f));
    return m;
  }, [customFoods]);

  useEffect(() => {
    if (!initial) {
      setName("");
      setItems([]);
      return;
    }
    setName(initial.name);
    const drafts: DraftItem[] = initial.items.map((it) => {
      if (it.source === "custom") {
        const f = customFoodMap.get(it.food_id);
        const qty = it.quantity || 1;
        const baseC = f?.calories || 0;
        const baseP = f?.protein || 0;
        const baseCa = f?.carbs || 0;
        const baseF = f?.fat || 0;
        return {
          source: "custom",
          food_id: it.food_id,
          quantity: qty,
          _qty: String(qty),
          _name: f?.name || `Custom #${it.food_id}`,
          _calories: baseC * qty,
          _protein: baseP * qty,
          _carbs: baseCa * qty,
          _fat: baseF * qty,
          _baseCalories: baseC,
          _baseProtein: baseP,
          _baseCarbs: baseCa,
          _baseFat: baseF,
        };
      }
      return {
        source: "database",
        food_id: it.food_id,
        quantity: it.quantity,
        _qty: String(it.quantity),
        _name: `Food #${it.food_id}`,
        _calories: 0,
        _protein: 0,
        _carbs: 0,
        _fat: 0,
        _baseCalories: 0,
        _baseProtein: 0,
        _baseCarbs: 0,
        _baseFat: 0,
      };
    });
    setItems(drafts);
  }, [initial, customFoodMap]);

  useEffect(() => {
    if (source !== "database") {
      setResults([]);
      return;
    }
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await autocompleteFoods(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, source]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, it) => ({
          kcal: acc.kcal + it._calories,
          protein: acc.protein + it._protein,
          carbs: acc.carbs + it._carbs,
          fat: acc.fat + it._fat,
        }),
        { kcal: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [items]
  );

  const addCustom = (f: CustomFood) => {
    setItems((prev) => [
      ...prev,
      {
        source: "custom",
        food_id: f.id,
        quantity: 1,
        _qty: "1",
        _name: f.name,
        _calories: f.calories,
        _protein: f.protein,
        _carbs: f.carbs,
        _fat: f.fat,
        _baseCalories: f.calories,
        _baseProtein: f.protein,
        _baseCarbs: f.carbs,
        _baseFat: f.fat,
      },
    ]);
  };

  const addDb = (f: Food) => {
    const grams = 100;
    const scale = grams / 100;
    setItems((prev) => [
      ...prev,
      {
        source: "database",
        food_id: f.id,
        quantity: grams,
        _qty: String(grams),
        _name: f.name,
        _calories: f.calories * scale,
        _protein: f.protein * scale,
        _carbs: f.carbs * scale,
        _fat: f.fat * scale,
        _baseCalories: f.calories,
        _baseProtein: f.protein,
        _baseCarbs: f.carbs,
        _baseFat: f.fat,
      },
    ]);
    setQuery("");
    setResults([]);
  };

  const updateQtyText = (idx: number, text: string) => {
    if (!NUMERIC_RE.test(text)) return;
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const qty = parseQty(text);
        const baseUnits = it.source === "custom" ? 1 : 100;
        const ratio = qty / baseUnits;
        return {
          ...it,
          _qty: text,
          quantity: qty,
          _calories: it._baseCalories * ratio,
          _protein: it._baseProtein * ratio,
          _carbs: it._baseCarbs * ratio,
          _fat: it._baseFat * ratio,
        };
      })
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Meal name is required");
      return;
    }
    if (items.length === 0) {
      setError("Add at least one food to the meal");
      return;
    }
    if (items.some((it) => it.quantity <= 0)) {
      setError("Each item needs a quantity greater than 0");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        items: items.map(({ source, food_id, quantity }) => ({
          source,
          food_id,
          quantity,
        })),
      });
    } catch (err: any) {
      setError(err?.detail || "Failed to save meal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-600 font-medium">Meal name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Post Workout Shake"
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
        />
      </label>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <div className="flex items-center gap-1 mb-3" role="tablist">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={source === s.id}
              onClick={() => setSource(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                source === s.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {source === "custom" ? (
          <div className="max-h-44 overflow-y-auto flex flex-col gap-1.5">
            {customFoods.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                No custom foods yet. Create one in My foods first.
              </p>
            ) : (
              customFoods.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => addCustom(f)}
                  className="flex items-center justify-between bg-white border border-slate-200 hover:border-primary hover:ring-1 hover:ring-primary/30 text-left px-3 py-2 rounded-lg transition-all"
                >
                  <span className="text-sm text-slate-900 truncate">{f.name}</span>
                  <span className="text-xs text-primary shrink-0 ml-2 font-medium">
                    {Math.round(f.calories)} kcal
                  </span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the database..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              />
            </div>
            {searching && (
              <p className="text-xs text-slate-500 mt-2">Searching...</p>
            )}
            {results.length > 0 && (
              <div className="mt-2 max-h-44 overflow-y-auto flex flex-col gap-1.5">
                {results.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => addDb(f)}
                    className="flex items-center justify-between bg-white border border-slate-200 hover:border-primary hover:ring-1 hover:ring-primary/30 text-left px-3 py-2 rounded-lg transition-all"
                  >
                    <span className="text-sm text-slate-900 truncate">{f.name}</span>
                    <span className="text-xs text-primary shrink-0 ml-2 font-medium">
                      {Math.round(f.calories)} kcal/100g
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-600 font-medium">Items</p>
          {items.map((it, idx) => (
            <div
              key={`${it.source}-${it.food_id}-${idx}`}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 truncate">{it._name}</p>
                <p className="text-[11px] text-primary font-medium">
                  {Math.round(it._calories)} kcal
                </p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={it._qty}
                  onChange={(e) => updateQtyText(idx, e.target.value)}
                  placeholder="0"
                  className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-900 text-right outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 placeholder:text-slate-400"
                />
                <span className="text-[10px] text-slate-500 w-8">
                  {it.source === "custom" ? "srv" : "g"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                aria-label="Remove item"
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="grid grid-cols-4 gap-2 mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <Total label="kcal" value={Math.round(totals.kcal)} unit="" highlight />
            <Total label="Protein" value={Math.round(totals.protein)} unit="g" />
            <Total label="Carbs" value={Math.round(totals.carbs)} unit="g" />
            <Total label="Fat" value={Math.round(totals.fat)} unit="g" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-full disabled:opacity-50 mt-1 hover:bg-green-600 transition-colors shadow-sm"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Total({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p
        className={`text-sm font-semibold ${
          highlight ? "text-primary" : "text-slate-900"
        }`}
      >
        {value}
        {unit && <span className="text-slate-400 text-xs ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}
