"use client";

import { CustomFoodForm } from "@/components/log-meal/CustomFoodForm";
import { Modal } from "@/components/log-meal/Modal";
import {
  addFoodToMeal, autocompleteFoods, createCustomFood, createCustomMeal,
  createMeal, listCustomFoods, logCustomFood,
} from "@/services/api";
import { CustomFood, CustomFoodInput, CustomMealInput, MealType } from "@/types/custom";
import { Food } from "@/types/food";
import { Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type FoodSource = "database" | "custom";

interface SelectedItem {
  key: string;
  source: FoodSource;
  dbFood?: Food;
  customFood?: CustomFood;
  name: string;
  quantity: number;
  quantityText: string;
}

interface SearchHit {
  source: FoodSource;
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dbFood?: Food;
  customFood?: CustomFood;
}

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch",     label: "Lunch"     },
  { id: "dinner",    label: "Dinner"    },
  { id: "snack",     label: "Snack"     },
];

const NUMERIC_RE = /^(\d+\.?\d*|\.\d*)?$/;

function parseQuantity(text: string): number {
  if (text === "" || text === ".") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

function keyFor(source: FoodSource, id: number) {
  return `${source}:${id}`;
}

function multiplierFor(item: SelectedItem) {
  return item.source === "database" ? item.quantity / 100 : item.quantity;
}

function baseMacros(item: SelectedItem) {
  const f = item.source === "database" ? item.dbFood : item.customFood;
  if (!f) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  return { calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat };
}

export default function CreateMealPage() {
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [query, setQuery] = useState("");
  const [dbResults, setDbResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [customMealName, setCustomMealName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [logging, setLogging] = useState(false);
  const [createFoodOpen, setCreateFoodOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);

  const showToast = (msg: string, tone: "success" | "error" = "success") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2200);
  };

  const refreshCustomFoods = useCallback(async () => {
    try { setCustomFoods(await listCustomFoods()); } catch { /* silent */ }
  }, []);

  useEffect(() => { refreshCustomFoods(); }, [refreshCustomFoods]);

  useEffect(() => {
    if (query.trim().length < 2) { setDbResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try { setDbResults(await autocompleteFoods(query)); }
      catch { setDbResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const searchHits: SearchHit[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const customHits: SearchHit[] = customFoods
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({ source: "custom", id: f.id, name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, customFood: f }));
    const dbHits: SearchHit[] = dbResults.map((f) => ({ source: "database", id: f.id, name: f.name, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, dbFood: f }));
    return [...customHits, ...dbHits];
  }, [query, customFoods, dbResults]);

  const totals = useMemo(() =>
    selected.reduce((acc, item) => {
      const m = multiplierFor(item);
      const b = baseMacros(item);
      return { calories: acc.calories + b.calories * m, protein: acc.protein + b.protein * m, carbs: acc.carbs + b.carbs * m, fat: acc.fat + b.fat * m };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 }),
    [selected]
  );

  const addHit = (hit: SearchHit) => {
    const k = keyFor(hit.source, hit.id);
    const existing = selected.find((s) => s.key === k);
    if (existing) {
      const bump = hit.source === "database" ? 100 : 1;
      const newQty = existing.quantity + bump;
      setSelected((prev) => prev.map((s) => s.key === k ? { ...s, quantity: newQty, quantityText: String(newQty) } : s));
    } else {
      const initialQty = hit.source === "database" ? 100 : 1;
      setSelected((prev) => [...prev, { key: k, source: hit.source, dbFood: hit.dbFood, customFood: hit.customFood, name: hit.name, quantity: initialQty, quantityText: String(initialQty) }]);
    }
    setQuery(""); setDbResults([]);
  };

  const updateQuantity = (k: string, text: string) => {
    if (!NUMERIC_RE.test(text)) return;
    setSelected((prev) => prev.map((s) => s.key === k ? { ...s, quantityText: text, quantity: parseQuantity(text) } : s));
  };

  const removeItem = (k: string) => setSelected((prev) => prev.filter((s) => s.key !== k));
  const reset = () => { setSelected([]); setCustomMealName(""); setQuery(""); setDbResults([]); };

  const handleLogMeal = async () => {
    if (!selected.length) return showToast("Add at least one food first", "error");
    if (selected.some((s) => s.quantity <= 0)) return showToast("Each food needs a quantity greater than 0", "error");
    setLogging(true);
    try {
      const today = new Date().toLocaleDateString("en-CA");
      const dbItems = selected.filter((s) => s.source === "database" && s.dbFood);
      if (dbItems.length) {
        const meal = await createMeal(today, mealType);
        const meal_id: number = meal.id ?? meal.meal_id;
        for (const item of dbItems) await addFoodToMeal(meal_id, item.dbFood!.id, item.quantity);
      }
      for (const item of selected.filter((s) => s.source === "custom" && s.customFood)) {
        await logCustomFood(item.customFood!.id, today, mealType, item.quantity);
      }
      showToast(`Logged ${selected.length} item${selected.length === 1 ? "" : "s"} to ${mealType}`);
      reset();
    } catch { showToast("Failed to log meal", "error"); }
    finally { setLogging(false); }
  };

  const handleSaveTemplate = async () => {
    if (!selected.length) return showToast("Add at least one food first", "error");
    if (!customMealName.trim()) return showToast("Give your meal a name first", "error");
    setSavingTemplate(true);
    try {
      const payload: CustomMealInput = {
        name: customMealName.trim(),
        items: selected.map((s) => ({ source: s.source, food_id: s.source === "database" ? s.dbFood!.id : s.customFood!.id, quantity: s.quantity })),
      };
      await createCustomMeal(payload);
      showToast(`Saved "${customMealName.trim()}"`);
      setCustomMealName("");
    } catch { showToast("Failed to save meal", "error"); }
    finally { setSavingTemplate(false); }
  };

  const handleCreateFood = async (input: CustomFoodInput) => {
    const created = await createCustomFood(input);
    setCustomFoods((prev) => [created, ...prev]);
    setSelected((prev) => [...prev, { key: keyFor("custom", created.id), source: "custom", customFood: created, name: created.name, quantity: 1, quantityText: "1" }]);
    setCreateFoodOpen(false);
    showToast(`Created "${created.name}"`);
  };

  const totalsData = [
    { label: "Calories", value: Math.round(totals.calories), unit: "kcal" },
    { label: "Protein",  value: Math.round(totals.protein),  unit: "g" },
    { label: "Carbs",    value: Math.round(totals.carbs),    unit: "g" },
    { label: "Fat",      value: Math.round(totals.fat),      unit: "g" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-400 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create meal</h1>
          <p className="text-sm text-muted mt-0.5">Build and log a meal</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateFoodOpen(true)}
          className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New food
        </button>
      </div>

      {/* Meal type */}
      <div className="flex gap-1 bg-surface-raised rounded-lg p-1">
        {MEAL_TYPES.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMealType(opt.id)}
            className={`flex-1 py-2 text-sm rounded-md transition-all font-medium ${
              mealType === opt.id
                ? "bg-white shadow-sm text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Search + selected */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-white border border-border rounded-xl p-5">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
              Add foods
            </p>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search database or your saved foods..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all"
              />
            </div>

            {searching && (
              <p className="flex items-center gap-1.5 text-xs text-muted mt-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching...
              </p>
            )}

            {searchHits.length > 0 && (
              <ul className="mt-2 max-h-64 overflow-y-auto divide-y divide-border border border-border rounded-lg">
                {searchHits.map((hit) => (
                  <li key={`${hit.source}:${hit.id}`}>
                    <button
                      type="button"
                      onClick={() => addHit(hit)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface-raised transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-foreground truncate">{hit.name}</p>
                          {hit.source === "custom" && (
                            <span className="shrink-0 text-[10px] font-medium text-muted border border-border rounded px-1.5 py-0.5">
                              Saved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted">
                          {Math.round(hit.calories)} kcal &middot; P {Math.round(hit.protein)}g &middot; C {Math.round(hit.carbs)}g &middot; F {Math.round(hit.fat)}g
                          <span className="text-subtle ml-1">
                            {hit.source === "custom" ? "/ serving" : "/ 100g"}
                          </span>
                        </p>
                      </div>
                      <Plus className="w-3.5 h-3.5 text-muted shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!searching && query.length >= 2 && searchHits.length === 0 && (
              <div className="flex items-center justify-between text-xs text-muted mt-2">
                <span>No matches for &quot;{query}&quot;</span>
                <button type="button" onClick={() => setCreateFoodOpen(true)}
                  className="text-foreground font-medium hover:underline underline-offset-2 transition-colors">
                  Create food
                </button>
              </div>
            )}
          </div>

          {/* Selected */}
          <div className="bg-white border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                Selected foods
              </p>
              <span className="text-xs text-subtle">{selected.length} item{selected.length !== 1 ? "s" : ""}</span>
            </div>

            {selected.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-lg">
                <p className="text-sm text-subtle">Search above and tap a food to add it</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {selected.map((item) => {
                  const m = multiplierFor(item);
                  const b = baseMacros(item);
                  return (
                    <li key={item.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted">
                          {Math.round(b.calories * m)} kcal &middot; P {Math.round(b.protein * m)}g
                        </p>
                      </div>
                      <div className="flex items-center border border-border rounded-md overflow-hidden focus-within:border-foreground/30 bg-white">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.quantityText}
                          onChange={(e) => updateQuantity(item.key, e.target.value)}
                          aria-label={`Quantity of ${item.name}`}
                          className="w-14 bg-transparent px-2 py-1.5 text-xs text-right outline-none text-foreground"
                        />
                        <span className="text-[10px] text-subtle pr-2">
                          {item.source === "custom" ? "srv" : "g"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-subtle hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Summary + actions */}
        <aside className="lg:col-span-1">
          <div className="bg-white border border-border rounded-xl p-5 lg:sticky lg:top-20 space-y-5">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Summary</p>
              <div className="grid grid-cols-2 gap-2">
                {totalsData.map((t) => (
                  <div key={t.label} className="bg-surface-raised rounded-lg px-3 py-3">
                    <p className="text-xs text-muted mb-1">{t.label}</p>
                    <p className="text-lg font-semibold tracking-tight">
                      {t.value}
                      <span className="text-xs text-subtle ml-1 font-normal">{t.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogMeal}
              disabled={logging || !selected.length}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-40 hover:bg-zinc-700 transition-colors"
            >
              {logging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {logging ? "Logging..." : `Log to ${mealType}`}
            </button>

            <div className="pt-4 border-t border-border space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Save as template</p>
              <input
                type="text"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                placeholder="Meal name..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !selected.length}
                className="w-full flex items-center justify-center gap-2 border border-border text-sm font-medium py-2.5 rounded-lg disabled:opacity-40 hover:bg-surface-raised transition-colors text-foreground"
              >
                {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save meal
              </button>
            </div>
          </div>
        </aside>
      </div>

      <Modal open={createFoodOpen} onClose={() => setCreateFoodOpen(false)} title="Create food">
        <CustomFoodForm onSubmit={handleCreateFood} submitLabel="Create food" />
      </Modal>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50 ${
            toast.tone === "error" ? "bg-red-600 text-white" : "bg-foreground text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
