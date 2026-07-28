"use client";

import { autocompleteFoods } from "@/services/api";
import { CustomFood, CustomMeal, CustomMealInput, CustomMealItemInput, FoodSource } from "@/types/custom";
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
  _qty: string;
  _name: string;
  _calories: number;
  _protein: number;
  _carbs: number;
  _fat: number;
  _baseCalories: number;
  _baseProtein: number;
  _baseCarbs: number;
  _baseFat: number;
}

const NUMERIC_RE = /^(\d+\.?\d*|\.\d*)?$/;

function parseQty(v: string): number {
  if (v === "" || v === ".") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

const inputCls = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all";
const labelCls = "block text-xs font-medium text-muted uppercase tracking-wider mb-1.5";

export function CustomMealForm({ initial, customFoods, onSubmit, submitLabel = "Save meal" }: CustomMealFormProps) {
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
    if (!initial) { setName(""); setItems([]); return; }
    setName(initial.name);
    setItems(initial.items.map((it) => {
      if (it.source === "custom") {
        const f = customFoodMap.get(it.food_id);
        const qty = it.quantity || 1;
        return { source: "custom", food_id: it.food_id, quantity: qty, _qty: String(qty),
          _name: f?.name || `Custom #${it.food_id}`, _calories: (f?.calories || 0) * qty,
          _protein: (f?.protein || 0) * qty, _carbs: (f?.carbs || 0) * qty,
          _fat: (f?.fat || 0) * qty, _baseCalories: f?.calories || 0,
          _baseProtein: f?.protein || 0, _baseCarbs: f?.carbs || 0, _baseFat: f?.fat || 0 };
      }
      return { source: "database", food_id: it.food_id, quantity: it.quantity, _qty: String(it.quantity),
        _name: `Food #${it.food_id}`, _calories: 0, _protein: 0, _carbs: 0, _fat: 0,
        _baseCalories: 0, _baseProtein: 0, _baseCarbs: 0, _baseFat: 0 };
    }));
  }, [initial, customFoodMap]);

  useEffect(() => {
    if (source !== "database" || query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try { setResults(await autocompleteFoods(query)); }
      catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, source]);

  const totals = useMemo(() =>
    items.reduce((acc, it) => ({ kcal: acc.kcal + it._calories, protein: acc.protein + it._protein,
      carbs: acc.carbs + it._carbs, fat: acc.fat + it._fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }), [items]);

  const addCustom = (f: CustomFood) => setItems((prev) => [...prev, {
    source: "custom", food_id: f.id, quantity: 1, _qty: "1", _name: f.name,
    _calories: f.calories, _protein: f.protein, _carbs: f.carbs, _fat: f.fat,
    _baseCalories: f.calories, _baseProtein: f.protein, _baseCarbs: f.carbs, _baseFat: f.fat,
  }]);

  const addDb = (f: Food) => {
    setItems((prev) => [...prev, { source: "database", food_id: f.id, quantity: 100, _qty: "100",
      _name: f.name, _calories: f.calories, _protein: f.protein, _carbs: f.carbs, _fat: f.fat,
      _baseCalories: f.calories, _baseProtein: f.protein, _baseCarbs: f.carbs, _baseFat: f.fat }]);
    setQuery(""); setResults([]);
  };

  const updateQtyText = (idx: number, text: string) => {
    if (!NUMERIC_RE.test(text)) return;
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const qty = parseQty(text);
      const baseUnits = it.source === "custom" ? 1 : 100;
      const ratio = qty / baseUnits;
      return { ...it, _qty: text, quantity: qty, _calories: it._baseCalories * ratio,
        _protein: it._baseProtein * ratio, _carbs: it._baseCarbs * ratio, _fat: it._baseFat * ratio };
    }));
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Meal name is required"); return; }
    if (!items.length) { setError("Add at least one food"); return; }
    if (items.some((it) => it.quantity <= 0)) { setError("Each item needs a quantity greater than 0"); return; }
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), items: items.map(({ source, food_id, quantity }) => ({ source, food_id, quantity })) });
    } catch (err: any) {
      setError(err?.detail || "Failed to save meal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Meal name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Post workout shake" className={inputCls} />
      </div>

      {/* Source picker */}
      <div className="flex gap-1 bg-surface-raised rounded-lg p-1">
        {([{ id: "custom", label: "My foods" }, { id: "database", label: "Database" }] as { id: FoodSource; label: string }[]).map((s) => (
          <button key={s.id} type="button" onClick={() => setSource(s.id)}
            className={`flex-1 py-1.5 text-sm rounded-md transition-all font-medium ${
              source === s.id ? "bg-white shadow-sm text-foreground" : "text-muted hover:text-foreground"
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Food picker */}
      <div className="border border-border rounded-lg overflow-hidden">
        {source === "custom" ? (
          <div className="max-h-44 overflow-y-auto divide-y divide-border">
            {customFoods.length === 0 ? (
              <p className="text-xs text-muted text-center py-6 px-3">No saved foods yet.</p>
            ) : customFoods.map((f) => (
              <button key={f.id} type="button" onClick={() => addCustom(f)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-raised text-left transition-colors">
                <span className="text-sm text-foreground truncate">{f.name}</span>
                <span className="text-xs text-muted shrink-0 ml-2">{Math.round(f.calories)} kcal</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods..." className={inputCls + " pl-9"} />
            </div>
            {searching && <p className="text-xs text-muted">Searching...</p>}
            {results.length > 0 && (
              <div className="max-h-44 overflow-y-auto divide-y divide-border border border-border rounded-lg">
                {results.map((f) => (
                  <button key={f.id} type="button" onClick={() => addDb(f)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-raised text-left transition-colors">
                    <span className="text-sm text-foreground truncate">{f.name}</span>
                    <span className="text-xs text-muted shrink-0 ml-2">{Math.round(f.calories)} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className={labelCls}>Items</p>
          {items.map((it, idx) => (
            <div key={`${it.source}-${it.food_id}-${idx}`}
              className="flex items-center gap-2 bg-surface-raised border border-border rounded-lg px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{it._name}</p>
                <p className="text-xs text-muted">{Math.round(it._calories)} kcal</p>
              </div>
              <div className="flex items-center border border-border rounded-md overflow-hidden bg-white">
                <input type="text" inputMode="decimal" value={it._qty}
                  onChange={(e) => updateQtyText(idx, e.target.value)}
                  placeholder="0"
                  className="w-14 bg-transparent px-2 py-1.5 text-xs text-right outline-none" />
                <span className="text-[10px] text-subtle pr-2">{it.source === "custom" ? "srv" : "g"}</span>
              </div>
              <button type="button" onClick={() => removeItem(idx)} className="text-subtle hover:text-red-500 p-1 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Totals */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              { label: "kcal",    value: Math.round(totals.kcal)    },
              { label: "Protein", value: Math.round(totals.protein) },
              { label: "Carbs",   value: Math.round(totals.carbs)   },
              { label: "Fat",     value: Math.round(totals.fat)     },
            ].map((t) => (
              <div key={t.label} className="bg-surface-raised rounded-lg px-2 py-2 text-center">
                <p className="text-[10px] text-muted uppercase tracking-wider">{t.label}</p>
                <p className="text-sm font-medium text-foreground">{t.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting}
        className="w-full bg-foreground text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 hover:bg-zinc-700 transition-colors mt-2">
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
