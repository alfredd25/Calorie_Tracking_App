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
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-white">
      <div className="flex-1">
        <p className="font-medium text-sm">{food.name}</p>
        <p className="text-xs text-slate-400">
          {(food.calories * quantity).toFixed(0)} cal | 
          P: {(food.protein * quantity).toFixed(1)}g | 
          C: {(food.carbs * quantity).toFixed(1)}g | 
          F: {(food.fat * quantity).toFixed(1)}g
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Input
          type="number"
          min={0.5}
          step={0.5}
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value))}
          className="w-16 text-center"
        />
        <Button size="sm" onClick={() => onAdd(food, quantity)}>
          Add
        </Button>
        <Button size="sm" variant="outline" onClick={() => onRemove(food)}>
          ✕
        </Button>
      </div>
    </div>
  );
}