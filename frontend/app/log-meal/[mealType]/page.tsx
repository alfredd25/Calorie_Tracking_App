"use client";

import { CustomFoodCard } from "@/components/log-meal/CustomFoodCard";
import { CustomFoodForm } from "@/components/log-meal/CustomFoodForm";
import { CustomMealCard } from "@/components/log-meal/CustomMealCard";
import { CustomMealForm } from "@/components/log-meal/CustomMealForm";
import { EmptyState } from "@/components/log-meal/EmptyState";
import { Modal } from "@/components/log-meal/Modal";
import { LogMealTab, TabBar } from "@/components/log-meal/TabBar";
import {
  createCustomFood,
  createCustomMeal,
  deleteCustomFood,
  deleteCustomMeal,
  listCustomFoods,
  listCustomMeals,
  logCustomFood,
  logCustomMeal,
  updateCustomFood,
  updateCustomMeal,
} from "@/services/api";
import {
  CustomFood,
  CustomFoodInput,
  CustomMeal,
  CustomMealInput,
  MealType,
} from "@/types/custom";
import { ChevronLeft, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function LogMealPage() {
  const router = useRouter();
  const params = useParams<{ mealType: string }>();
  const rawMealType = (params.mealType || "breakfast").toLowerCase();
  const mealType: MealType = (VALID_MEAL_TYPES as string[]).includes(rawMealType)
    ? (rawMealType as MealType)
    : "breakfast";

  const titleCase = mealType.charAt(0).toUpperCase() + mealType.slice(1);

  const [activeTab, setActiveTab] = useState<LogMealTab>("my-foods");
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<CustomFood | null>(null);
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<CustomMeal | null>(null);

  const today = useMemo(() => new Date().toLocaleDateString("en-CA"), []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [foods, meals] = await Promise.all([listCustomFoods(), listCustomMeals()]);
      setCustomFoods(foods);
      setCustomMeals(meals);
    } catch (err) {
      console.error("Failed to load custom foods/meals", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Food handlers ----
  const handleCreateFood = async (input: CustomFoodInput) => {
    await createCustomFood(input);
    setFoodModalOpen(false);
    setEditingFood(null);
    showToast("Food saved");
    refresh();
  };

  const handleUpdateFood = async (input: CustomFoodInput) => {
    if (!editingFood) return;
    await updateCustomFood(editingFood.id, input);
    setFoodModalOpen(false);
    setEditingFood(null);
    showToast("Food updated");
    refresh();
  };

  const handleDeleteFood = async (food: CustomFood) => {
    if (!confirm(`Delete "${food.name}"?`)) return;
    await deleteCustomFood(food.id);
    showToast("Food deleted");
    refresh();
  };

  const handleLogFood = async (food: CustomFood) => {
    try {
      await logCustomFood(food.id, today, mealType, 1);
      showToast(`Added to ${titleCase}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to log food");
    }
  };

  // ---- Meal handlers ----
  const handleCreateMeal = async (input: CustomMealInput) => {
    await createCustomMeal(input);
    setMealModalOpen(false);
    setEditingMeal(null);
    showToast("Meal saved");
    refresh();
  };

  const handleUpdateMeal = async (input: CustomMealInput) => {
    if (!editingMeal) return;
    await updateCustomMeal(editingMeal.id, input);
    setMealModalOpen(false);
    setEditingMeal(null);
    showToast("Meal updated");
    refresh();
  };

  const handleDeleteMeal = async (meal: CustomMeal) => {
    if (!confirm(`Delete "${meal.name}"?`)) return;
    await deleteCustomMeal(meal.id);
    showToast("Meal deleted");
    refresh();
  };

  const handleLogMeal = async (meal: CustomMeal) => {
    try {
      await logCustomMeal(meal.id, today, mealType);
      showToast(`Logged ${meal.name}`);
    } catch (err) {
      console.error(err);
      showToast("Failed to log meal");
    }
  };

  return (
    <div className="-mx-4 -mt-8 -mb-24 min-h-[calc(100vh-3.5rem)] bg-background pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3.5 sticky top-14 bg-white/90 backdrop-blur-md border-b border-border z-10">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold flex-1 ml-3 text-foreground">{titleCase}</h1>
        <button
          aria-label="Add"
          onClick={() => {
            setEditingFood(null);
            if (activeTab === "my-meals") { setEditingMeal(null); setMealModalOpen(true); }
            else setFoodModalOpen(true);
          }}
          className="text-muted hover:text-foreground transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <TabBar active={activeTab} onChange={setActiveTab} />

        <div>
          {loading ? (
            <p className="text-center text-subtle py-12 text-sm">Loading...</p>
          ) : activeTab === "favourites" ? (
            <p className="text-center text-subtle py-16 text-sm">Coming soon</p>
          ) : activeTab === "my-foods" ? (
            customFoods.length === 0 ? (
              <EmptyState message="Save foods you eat often to log them faster." buttonLabel="Add food"
                onAction={() => { setEditingFood(null); setFoodModalOpen(true); }} />
            ) : (
              <div className="flex flex-col gap-2 pb-24">
                {customFoods.map((f) => (
                  <CustomFoodCard key={f.id} food={f} onLog={handleLogFood}
                    onEdit={(food) => { setEditingFood(food); setFoodModalOpen(true); }}
                    onDelete={handleDeleteFood} />
                ))}
              </div>
            )
          ) : customMeals.length === 0 ? (
            <EmptyState message="Group foods into meals and log them in one tap." buttonLabel="Add meal"
              onAction={() => { setEditingMeal(null); setMealModalOpen(true); }} />
          ) : (
            <div className="flex flex-col gap-2 pb-24">
              {customMeals.map((m) => (
                <CustomMealCard key={m.id} meal={m} onLog={handleLogMeal}
                  onEdit={(meal) => { setEditingMeal(meal); setMealModalOpen(true); }}
                  onDelete={handleDeleteMeal} />
              ))}
            </div>
          )}
        </div>

        {!loading && activeTab === "my-foods" && customFoods.length > 0 && (
          <FloatingAddButton label="Add food" onClick={() => { setEditingFood(null); setFoodModalOpen(true); }} />
        )}
        {!loading && activeTab === "my-meals" && customMeals.length > 0 && (
          <FloatingAddButton label="Add meal" onClick={() => { setEditingMeal(null); setMealModalOpen(true); }} />
        )}
      </div>

      {toast && (
        <div role="status" aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}

      <Modal open={foodModalOpen} onClose={() => { setFoodModalOpen(false); setEditingFood(null); }}
        title={editingFood ? "Edit food" : "Add food"}>
        <CustomFoodForm initial={editingFood}
          onSubmit={editingFood ? handleUpdateFood : handleCreateFood}
          submitLabel={editingFood ? "Update food" : "Save food"} />
      </Modal>

      <Modal open={mealModalOpen} onClose={() => { setMealModalOpen(false); setEditingMeal(null); }}
        title={editingMeal ? "Edit meal" : "Add meal"}>
        <CustomMealForm initial={editingMeal} customFoods={customFoods}
          onSubmit={editingMeal ? handleUpdateMeal : handleCreateMeal}
          submitLabel={editingMeal ? "Update meal" : "Save meal"} />
      </Modal>
    </div>
  );
}

function FloatingAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground hover:bg-zinc-700 text-white text-sm font-medium px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg z-40 transition-colors">
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
