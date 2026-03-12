"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Food } from "@/types/food";
import { FoodSearch } from "@/components/ui/food-search";
import { MealCard } from "@/components/ui/meal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMeal, addFoodToMeal } from "@/services/api";
import { getUserId, isLoggedIn } from "@/services/auth";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export default function MealsPage() {
  const router = useRouter();
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");
  const [selectedFoods, setSelectedFoods] = useState<Food[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, [router]);

  function handleFoodSelect(food: Food) {
    if (!selectedFoods.find((f) => f.id === food.id)) {
      setSelectedFoods((prev) => [...prev, food]);
    }
  }

  function handleFoodRemove(food: Food) {
    setSelectedFoods((prev) => prev.filter((f) => f.id !== food.id));
  }

  async function handleSaveMeal(food: Food, quantity: number) {
    setSaving(true);
    setMessage("");
    try {
      const userId = getUserId();
      if (!userId) throw new Error("Not logged in");

      const today = new Date().toISOString().split("T")[0];
      const meal = await createMeal(userId, today, selectedMealType);
      await addFoodToMeal(meal.meal_id, food.id, quantity);

      setMessage(`✓ ${food.name} added to ${selectedMealType}`);
      setSelectedFoods((prev) => prev.filter((f) => f.id !== food.id));
    } catch (err: any) {
      setMessage(err.detail || "Failed to save meal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Log Meal</h1>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
        </div>

        {/* Meal Type Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meal Type</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            {MEAL_TYPES.map((type) => (
              <Button
                key={type}
                variant={selectedMealType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMealType(type)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Food Search */}
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="text-base">Search Food</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <FoodSearch onSelect={handleFoodSelect} />
          </CardContent>
        </Card>

        {/* Selected Foods */}
        {selectedFoods.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Foods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedFoods.map((food) => (
                <MealCard
                  key={food.id}
                  food={food}
                  onAdd={handleSaveMeal}
                  onRemove={handleFoodRemove}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {message && (
          <p className={`text-sm text-center ${message.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
            {message}
          </p>
        )}

        {saving && <p className="text-center text-sm text-slate-400">Saving...</p>}
      </div>
    </div>
  );
}