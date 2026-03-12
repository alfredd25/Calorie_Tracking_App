"use client";

import { Food } from "@/types/food";
import { useFoodSearch } from "@/hooks/useFoodSearch";
import { Input } from "@/components/ui/input";

interface FoodSearchProps {
  onSelect: (food: Food) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const { query, setQuery, results, loading } = useFoodSearch();

  function handleSelect(food: Food) {
    onSelect(food);
    setQuery("");
  }

  return (
    <div className="relative w-full">
      <Input
        placeholder="Search foods... (e.g. chicken, rice)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && (
        <p className="text-xs text-slate-400 mt-1">Searching...</p>
      )}
      {results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-md mt-1 max-h-60 overflow-y-auto">
          {results.map((food) => (
            <li
              key={food.id}
              className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm"
              onClick={() => handleSelect(food)}
            >
              <span className="font-medium">{food.name}</span>
              <span className="text-slate-400 ml-2">
                {food.calories} cal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}