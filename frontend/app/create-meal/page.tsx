"use client";

import { CustomFoodForm } from "@/components/log-meal/CustomFoodForm";
import { Modal } from "@/components/log-meal/Modal";
import {
  addFoodToMeal,
  autocompleteFoods,
  createCustomFood,
  createCustomMeal,
  createMeal,
  listCustomFoods,
  logCustomFood,
} from "@/services/api";
import { CustomFood, CustomFoodInput, CustomMealInput, MealType } from "@/types/custom";
import { Food } from "@/types/food";
import {
  ChefHat,
  Coffee,
  Cookie,
  Loader2,
  Moon,
  Plus,
  Save,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type FoodSource = "database" | "custom";

interface SelectedItem {
  // Composite key so a database food and a custom food with the same id don't clash
  key: string;
  source: FoodSource;
  // Backing food (one of these is set depending on source)
  dbFood?: Food;
  customFood?: CustomFood;
  // Display name (from whichever source)
  name: string;
  // Quantity: grams for database (per-100g basis), servings for custom (per-serving totals)
  quantity: number;
  quantityText: string;
}

interface SearchHit {
  source: FoodSource;
  id: number;
  name: string;
  // Per 100g for database, per serving total for custom
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  dbFood?: Food;
  customFood?: CustomFood;
}

interface MealOption {
  id: MealType;
  label: string;
  Icon: typeof Coffee;
  active: string;
  inactive: string;
  iconBg: string;
}

const MEAL_OPTIONS: MealOption[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    Icon: Coffee,
    active:
      "bg-gradient-to-br from-amber-100 to-yellow-50 border-amber-300 ring-2 ring-amber-300",
    inactive:
      "bg-white border-slate-200 hover:border-amber-200 hover:bg-amber-50/40",
    iconBg: "bg-amber-100 text-amber-700",
  },
  {
    id: "lunch",
    label: "Lunch",
    Icon: Sun,
    active:
      "bg-gradient-to-br from-green-100 to-emerald-50 border-green-300 ring-2 ring-green-300",
    inactive:
      "bg-white border-slate-200 hover:border-green-200 hover:bg-green-50/40",
    iconBg: "bg-green-100 text-green-700",
  },
  {
    id: "dinner",
    label: "Dinner",
    Icon: Moon,
    active:
      "bg-gradient-to-br from-blue-100 to-indigo-50 border-blue-300 ring-2 ring-blue-300",
    inactive:
      "bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/40",
    iconBg: "bg-blue-100 text-blue-700",
  },
  {
    id: "snack",
    label: "Snack",
    Icon: Cookie,
    active:
      "bg-gradient-to-br from-purple-100 to-fuchsia-50 border-purple-300 ring-2 ring-purple-300",
    inactive:
      "bg-white border-slate-200 hover:border-purple-200 hover:bg-purple-50/40",
    iconBg: "bg-purple-100 text-purple-700",
  },
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

// For a SelectedItem, compute the macro multiplier:
// - database: quantity is grams, base values are per 100g, so multiplier = quantity / 100
// - custom: quantity is servings, base values are per 1 serving, so multiplier = quantity
function multiplierFor(item: SelectedItem): number {
  return item.source === "database" ? item.quantity / 100 : item.quantity;
}

function baseMacros(item: SelectedItem) {
  if (item.source === "database" && item.dbFood) {
    return {
      calories: item.dbFood.calories,
      protein: item.dbFood.protein,
      carbs: item.dbFood.carbs,
      fat: item.dbFood.fat,
    };
  }
  if (item.source === "custom" && item.customFood) {
    return {
      calories: item.customFood.calories,
      protein: item.customFood.protein,
      carbs: item.customFood.carbs,
      fat: item.customFood.fat,
    };
  }
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export default function CreateMealPage() {
  const [mealType, setMealType] = useState<MealType>("breakfast");

  // Search state
  const [query, setQuery] = useState("");
  const [dbResults, setDbResults] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);

  // User's custom foods (loaded once and filtered locally)
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);

  // Selection
  const [selected, setSelected] = useState<SelectedItem[]>([]);

  // Save-as-custom-meal state
  const [customMealName, setCustomMealName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Logging state
  const [logging, setLogging] = useState(false);

  // Create-food modal state
  const [createFoodOpen, setCreateFoodOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);
  const showToast = (msg: string, tone: "success" | "error" = "success") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2200);
  };

  // Load custom foods on mount
  const refreshCustomFoods = useCallback(async () => {
    try {
      const data = await listCustomFoods();
      setCustomFoods(data);
    } catch (err) {
      console.error("Failed to load custom foods", err);
    }
  }, []);

  useEffect(() => {
    refreshCustomFoods();
  }, [refreshCustomFoods]);

  // Debounced database search
  useEffect(() => {
    if (query.trim().length < 2) {
      setDbResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const data = await autocompleteFoods(query);
        setDbResults(data);
      } catch {
        setDbResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Merge database results + matching custom foods (custom listed first, badge "Yours")
  const searchHits: SearchHit[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const customHits: SearchHit[] = customFoods
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({
        source: "custom",
        id: f.id,
        name: f.name,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        customFood: f,
      }));

    const dbHits: SearchHit[] = dbResults.map((f) => ({
      source: "database",
      id: f.id,
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      dbFood: f,
    }));

    return [...customHits, ...dbHits];
  }, [query, customFoods, dbResults]);

  const totals = useMemo(
    () =>
      selected.reduce(
        (acc, item) => {
          const m = multiplierFor(item);
          const base = baseMacros(item);
          return {
            calories: acc.calories + base.calories * m,
            protein: acc.protein + base.protein * m,
            carbs: acc.carbs + base.carbs * m,
            fat: acc.fat + base.fat * m,
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [selected]
  );

  const addHit = (hit: SearchHit) => {
    const k = keyFor(hit.source, hit.id);
    const existing = selected.find((s) => s.key === k);
    if (existing) {
      // Bump quantity: +100g for database, +1 serving for custom
      const bump = hit.source === "database" ? 100 : 1;
      const newQty = existing.quantity + bump;
      setSelected((prev) =>
        prev.map((s) =>
          s.key === k
            ? { ...s, quantity: newQty, quantityText: String(newQty) }
            : s
        )
      );
    } else {
      const initialQty = hit.source === "database" ? 100 : 1;
      setSelected((prev) => [
        ...prev,
        {
          key: k,
          source: hit.source,
          dbFood: hit.dbFood,
          customFood: hit.customFood,
          name: hit.name,
          quantity: initialQty,
          quantityText: String(initialQty),
        },
      ]);
    }
    setQuery("");
    setDbResults([]);
  };

  const updateQuantity = (k: string, text: string) => {
    if (!NUMERIC_RE.test(text)) return;
    setSelected((prev) =>
      prev.map((s) =>
        s.key === k
          ? { ...s, quantityText: text, quantity: parseQuantity(text) }
          : s
      )
    );
  };

  const removeItem = (k: string) => {
    setSelected((prev) => prev.filter((s) => s.key !== k));
  };

  const reset = () => {
    setSelected([]);
    setCustomMealName("");
    setQuery("");
    setDbResults([]);
  };

  const handleLogMeal = async () => {
    if (selected.length === 0) {
      showToast("Add at least one food before logging", "error");
      return;
    }
    if (selected.some((s) => s.quantity <= 0)) {
      showToast("Each food needs a quantity greater than 0", "error");
      return;
    }
    setLogging(true);
    try {
      const today = new Date().toLocaleDateString("en-CA");

      // Database items: create a single Meal row, then add each as a MealItem.
      const dbItems = selected.filter((s) => s.source === "database" && s.dbFood);
      if (dbItems.length > 0) {
        const meal = await createMeal(today, mealType);
        const meal_id: number = meal.id ?? meal.meal_id;
        for (const item of dbItems) {
          await addFoodToMeal(meal_id, item.dbFood!.id, item.quantity);
        }
      }

      // Custom items: each one logs as its own MealItem in today's meal of this type.
      const customItems = selected.filter((s) => s.source === "custom" && s.customFood);
      for (const item of customItems) {
        await logCustomFood(item.customFood!.id, today, mealType, item.quantity);
      }

      showToast(
        `Logged ${selected.length} item${selected.length === 1 ? "" : "s"} to ${mealType}`
      );
      reset();
    } catch (err: any) {
      showToast(err?.detail || "Failed to log meal", "error");
    } finally {
      setLogging(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (selected.length === 0) {
      showToast("Add at least one food before saving", "error");
      return;
    }
    if (!customMealName.trim()) {
      showToast("Give your meal a name first", "error");
      return;
    }
    setSavingTemplate(true);
    try {
      const payload: CustomMealInput = {
        name: customMealName.trim(),
        items: selected.map((s) => ({
          source: s.source,
          food_id: s.source === "database" ? s.dbFood!.id : s.customFood!.id,
          quantity: s.quantity,
        })),
      };
      await createCustomMeal(payload);
      showToast(`Saved "${customMealName.trim()}" to My Meals`);
      setCustomMealName("");
    } catch (err: any) {
      showToast(err?.detail || "Failed to save meal", "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleCreateFood = async (input: CustomFoodInput) => {
    const created = await createCustomFood(input);
    setCustomFoods((prev) => [created, ...prev]);
    // Auto-add the freshly created food to the current selection at 1 serving
    setSelected((prev) => [
      ...prev,
      {
        key: keyFor("custom", created.id),
        source: "custom",
        customFood: created,
        name: created.name,
        quantity: 1,
        quantityText: "1",
      },
    ]);
    setCreateFoodOpen(false);
    showToast(`Created "${created.name}"`);
  };

  const activeOption = MEAL_OPTIONS.find((o) => o.id === mealType)!;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Meal</h1>
          <p className="text-slate-500 font-medium">Build and log your meals</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateFoodOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 bg-white border border-primary text-primary font-semibold px-4 py-2 rounded-full hover:bg-green-50 transition-colors shadow-sm"
        >
          <ChefHat className="w-4 h-4" />
          Create food
        </button>
      </div>

      {/* Meal type selector */}
      <section aria-label="Meal type" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MEAL_OPTIONS.map((opt) => {
          const isActive = opt.id === mealType;
          const { Icon } = opt;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setMealType(opt.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 transition-all shadow-sm ${
                isActive ? opt.active : opt.inactive
              }`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center ${opt.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
            </button>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: search + selected foods */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Search */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">
                Add foods to your {activeOption.label.toLowerCase()}
              </label>
              <button
                type="button"
                onClick={() => setCreateFoodOpen(true)}
                className="sm:hidden inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-green-600"
              >
                <ChefHat className="w-3.5 h-3.5" />
                Create food
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods (your foods + database)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              />
            </div>

            {searching && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching...
              </p>
            )}

            {searchHits.length > 0 && (
              <ul className="mt-3 max-h-72 overflow-y-auto flex flex-col gap-1.5">
                {searchHits.map((hit) => (
                  <li key={`${hit.source}:${hit.id}`}>
                    <button
                      type="button"
                      onClick={() => addHit(hit)}
                      className="w-full flex items-center justify-between bg-slate-50 hover:bg-white hover:border-primary/40 hover:ring-1 hover:ring-primary/20 border border-transparent text-left px-3 py-2 rounded-lg transition-all"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-900 truncate">
                            {hit.name}
                          </p>
                          {hit.source === "custom" && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              Yours
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {Math.round(hit.calories)} kcal · P {Math.round(hit.protein)}g · C {Math.round(hit.carbs)}g · F {Math.round(hit.fat)}g
                          <span className="text-slate-400">
                            {hit.source === "custom" ? " per serving" : " per 100g"}
                          </span>
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!searching && query.length >= 2 && searchHits.length === 0 && (
              <div className="mt-3 text-xs text-slate-500 flex items-center justify-between gap-2">
                <span>No matches for &quot;{query}&quot;.</span>
                <button
                  type="button"
                  onClick={() => setCreateFoodOpen(true)}
                  className="text-primary font-semibold hover:text-green-600"
                >
                  Create it instead
                </button>
              </div>
            )}
          </div>

          {/* Selected foods */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Selected Foods</h2>
              <span className="text-xs text-slate-500">
                {selected.length} item{selected.length === 1 ? "" : "s"}
              </span>
            </div>

            {selected.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-sm text-slate-500">
                  Search and tap a food, or create your own.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {selected.map((item) => {
                  const m = multiplierFor(item);
                  const base = baseMacros(item);
                  const unit = item.source === "custom" ? "srv" : "g";
                  return (
                    <li
                      key={item.key}
                      className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {item.name}
                          </p>
                          {item.source === "custom" && (
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              Yours
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {Math.round(base.calories * m)} kcal · P{" "}
                          {Math.round(base.protein * m)}g · C{" "}
                          {Math.round(base.carbs * m)}g · F{" "}
                          {Math.round(base.fat * m)}g
                        </p>
                      </div>
                      <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.quantityText}
                          onChange={(e) => updateQuantity(item.key, e.target.value)}
                          aria-label={`Quantity of ${item.name}`}
                          className="w-16 bg-transparent px-2 py-1 text-xs text-slate-900 text-right outline-none"
                        />
                        <span className="text-[10px] text-slate-500 px-1.5">{unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        aria-label={`Remove ${item.name}`}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right column: summary + actions */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:sticky lg:top-20 flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Summary</h2>
              <p className="text-xs text-slate-500">
                Logging to{" "}
                <span className="font-semibold text-slate-700">
                  {activeOption.label}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat label="Calories" value={Math.round(totals.calories)} unit="kcal" highlight />
              <Stat label="Protein" value={Math.round(totals.protein)} unit="g" />
              <Stat label="Carbs" value={Math.round(totals.carbs)} unit="g" />
              <Stat label="Fat" value={Math.round(totals.fat)} unit="g" />
            </div>

            <button
              type="button"
              onClick={handleLogMeal}
              disabled={logging || selected.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-full disabled:opacity-50 hover:bg-green-600 transition-colors shadow-sm"
            >
              {logging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {logging ? "Logging..." : "Log Meal"}
            </button>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-600">
                Save as Custom Meal (optional)
              </label>
              <input
                type="text"
                value={customMealName}
                onChange={(e) => setCustomMealName(e.target.value)}
                placeholder="e.g. Post Workout Shake"
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate || selected.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-white border border-primary text-primary font-semibold py-2 rounded-full disabled:opacity-50 hover:bg-green-50 transition-colors"
              >
                {savingTemplate ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save as Custom Meal
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Create food modal */}
      <Modal
        open={createFoodOpen}
        onClose={() => setCreateFoodOpen(false)}
        title="Create food"
      >
        <p className="text-xs text-slate-500 mb-4">
          Add the per-serving values. Your food appears in search and can be logged
          like any database item.
        </p>
        <CustomFoodForm onSubmit={handleCreateFood} submitLabel="Create food" />
      </Modal>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm shadow-lg z-50 ${
            toast.tone === "success"
              ? "bg-slate-900 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Stat({
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
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p
        className={`text-lg font-bold ${
          highlight ? "text-primary" : "text-slate-900"
        }`}
      >
        {value}
        <span className="text-slate-400 text-xs ml-1 font-medium">{unit}</span>
      </p>
    </div>
  );
}
