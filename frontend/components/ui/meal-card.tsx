"use client";

import { Food } from "@/types/food";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MealCardProps {
  food: Food;
  onAdd: (food: Food, quantity: number) => void;
  onRemove: (food: Food) => void;
}

export function MealCard({ food, onAdd, onRemove }: MealCardProps) {
  const [grams, setGrams] = useState(100);

  // USDA macros are per 100g so we scale by grams/100
  const scale = grams / 100;

  return (
    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-white">
      <div className="flex-1">
        <p className="font-medium text-sm">{food.name}</p>
        <p className="text-xs text-slate-400">
          {(food.calories * scale).toFixed(0)} cal |
          P: {(food.protein * scale).toFixed(1)}g |
          C: {(food.carbs * scale).toFixed(1)}g |
          F: {(food.fat * scale).toFixed(1)}g
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min={1}
            step={10}
            value={grams}
            onChange={(e) => setGrams(parseFloat(e.target.value))}
            className="w-20 text-center"
          />
          <span className="text-xs text-slate-400">g</span>
        </div>
        <Button size="sm" onClick={() => onAdd(food, grams / 100)}>
          Add
        </Button>
        <Button size="sm" variant="outline" onClick={() => onRemove(food)}>
          ✕
        </Button>
      </div>
    </div>
  );
}