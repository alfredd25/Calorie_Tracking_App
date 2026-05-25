"use client";

import { CustomFood } from "@/types/custom";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface CustomFoodCardProps {
  food: CustomFood;
  onLog: (food: CustomFood) => void;
  onEdit: (food: CustomFood) => void;
  onDelete: (food: CustomFood) => void;
}

export function CustomFoodCard({ food, onLog, onEdit, onDelete }: CustomFoodCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 font-medium truncate">{food.name}</p>
          <p className="text-xs text-primary mt-0.5 font-medium">
            {Math.round(food.calories)} kcal
          </p>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
          <div className="grid grid-cols-3 gap-2 my-3">
            <Macro label="Protein" value={food.protein} />
            <Macro label="Carbs" value={food.carbs} />
            <Macro label="Fat" value={food.fat} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLog(food)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-semibold py-2 rounded-full text-sm hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Log
            </button>
            <button
              onClick={() => onEdit(food)}
              aria-label={`Edit ${food.name}`}
              className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-primary transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(food)}
              aria-label={`Delete ${food.name}`}
              className="p-2 rounded-full bg-slate-100 text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900">
        {Math.round(value * 10) / 10}
        <span className="text-slate-400 text-xs ml-0.5">g</span>
      </p>
    </div>
  );
}
