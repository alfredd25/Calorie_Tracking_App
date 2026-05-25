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
import { ChevronLeft, MoreVertical, Plus } from "lucide-react";
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
    <div className="-mx-4 -mt-8 -mb-20 min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 sticky top-16 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 z-10">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="p-1.5 -ml-1.5 text-slate-700 hover:text-primary"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold flex-1 ml-2 text-slate-900">{titleCase}</h1>
        <div className="flex items-center gap-2 ml-auto">
          <button
            aria-label="Add"
            onClick={() => {
              setEditingFood(null);
              if (activeTab === "my-meals") {
                setEditingMeal(null);
                setMealModalOpen(true);
              } else {
                setFoodModalOpen(true);
              }
            }}
            className="p-1.5 text-slate-700 hover:text-primary"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button aria-label="More" className="p-1.5 text-slate-700 hover:text-primary">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="px-4">
        {/* Tabs */}
        <div className="mt-2">
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="mt-4">
          {loading ? (
            <p className="text-center text-slate-400 py-12 text-sm">Loading...</p>
          ) : activeTab === "favourites" ? (
            <div className="text-center text-slate-400 py-16 text-sm">
              Coming soon.
            </div>
          ) : activeTab === "my-foods" ? (
            customFoods.length === 0 ? (
              <EmptyState
                message="Log meals faster by adding foods that you eat often."
                buttonLabel="Add food"
                onAction={() => {
                  setEditingFood(null);
                  setFoodModalOpen(true);
                }}
              />
            ) : (
              <div className="flex flex-col gap-2 pb-24">
                {customFoods.map((f) => (
                  <CustomFoodCard
                    key={f.id}
                    food={f}
                    onLog={handleLogFood}
                    onEdit={(food) => {
                      setEditingFood(food);
                      setFoodModalOpen(true);
                    }}
                    onDelete={handleDeleteFood}
                  />
                ))}
              </div>
            )
          ) : customMeals.length === 0 ? (
            <EmptyState
              message="Group foods you eat together into meals you can log in one tap."
              buttonLabel="Add meal"
              onAction={() => {
                setEditingMeal(null);
                setMealModalOpen(true);
              }}
            />
          ) : (
            <div className="flex flex-col gap-2 pb-24">
              {customMeals.map((m) => (
                <CustomMealCard
                  key={m.id}
                  meal={m}
                  onLog={handleLogMeal}
                  onEdit={(meal) => {
                    setEditingMeal(meal);
                    setMealModalOpen(true);
                  }}
                  onDelete={handleDeleteMeal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating add button when there is content */}
        {!loading &&
          activeTab === "my-foods" &&
          customFoods.length > 0 && (
            <FloatingAddButton
              label="Add food"
              onClick={() => {
                setEditingFood(null);
                setFoodModalOpen(true);
              }}
            />
          )}
        {!loading &&
          activeTab === "my-meals" &&
          customMeals.length > 0 && (
            <FloatingAddButton
              label="Add meal"
              onClick={() => {
                setEditingMeal(null);
                setMealModalOpen(true);
              }}
            />
          )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm shadow-lg z-50"
        >
          {toast}
        </div>
      )}

      {/* Custom food modal */}
      <Modal
        open={foodModalOpen}
        onClose={() => {
          setFoodModalOpen(false);
          setEditingFood(null);
        }}
        title={editingFood ? "Edit food" : "Add food"}
      >
        <CustomFoodForm
          initial={editingFood}
          onSubmit={editingFood ? handleUpdateFood : handleCreateFood}
          submitLabel={editingFood ? "Update food" : "Save food"}
        />
      </Modal>

      {/* Custom meal modal */}
      <Modal
        open={mealModalOpen}
        onClose={() => {
          setMealModalOpen(false);
          setEditingMeal(null);
        }}
        title={editingMeal ? "Edit meal" : "Add meal"}
      >
        <CustomMealForm
          initial={editingMeal}
          customFoods={customFoods}
          onSubmit={editingMeal ? handleUpdateMeal : handleCreateMeal}
          submitLabel={editingMeal ? "Update meal" : "Save meal"}
        />
      </Modal>
    </div>
  );
}

function FloatingAddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary hover:bg-green-600 text-primary-foreground font-semibold px-8 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-green-900/30 z-40"
    >
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
