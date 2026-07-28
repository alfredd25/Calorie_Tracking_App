"use client";

import { CustomMeal } from "@/types/custom";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface CustomMealCardProps {
  meal: CustomMeal;
  onLog: (meal: CustomMeal) => void;
  onEdit: (meal: CustomMeal) => void;
  onDelete: (meal: CustomMeal) => void;
}

export function CustomMealCard({ meal, onLog, onEdit, onDelete }: CustomMealCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-surface-raised transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{meal.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {Math.round(meal.total_kcal)} kcal &middot; {meal.items.length} item{meal.items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-subtle transition-transform shrink-0 ml-2 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <div className="grid grid-cols-3 gap-2 my-3">
            {[
              { label: "Protein", value: meal.total_protein },
              { label: "Carbs",   value: meal.total_carbs   },
              { label: "Fat",     value: meal.total_fat     },
            ].map((m) => (
              <div key={m.label} className="bg-surface-raised rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">{m.label}</p>
                <p className="text-sm font-medium text-foreground">
                  {Math.round(m.value * 10) / 10}
                  <span className="text-subtle text-xs ml-0.5">g</span>
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLog(meal)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-foreground text-white text-sm font-medium py-2 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Log meal
            </button>
            <button
              onClick={() => onEdit(meal)}
              aria-label={`Edit ${meal.name}`}
              className="p-2 rounded-lg bg-surface-raised text-muted hover:text-foreground hover:bg-border transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(meal)}
              aria-label={`Delete ${meal.name}`}
              className="p-2 rounded-lg bg-surface-raised text-muted hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
