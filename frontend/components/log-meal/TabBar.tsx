"use client";

import { cn } from "@/lib/utils";

export type LogMealTab = "favourites" | "my-foods" | "my-meals";

interface TabBarProps {
  active: LogMealTab;
  onChange: (tab: LogMealTab) => void;
}

const TABS: { id: LogMealTab; label: string }[] = [
  { id: "favourites", label: "Favourites" },
  { id: "my-foods", label: "My foods" },
  { id: "my-meals", label: "My meals" },
];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Log meal tabs"
      className="flex items-center justify-around gap-2 px-2 py-2"
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
