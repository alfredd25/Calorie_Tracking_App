"use client";

import { cn } from "@/lib/utils";

export type LogMealTab = "favourites" | "my-foods" | "my-meals";

interface TabBarProps {
  active: LogMealTab;
  onChange: (tab: LogMealTab) => void;
}

const TABS: { id: LogMealTab; label: string }[] = [
  { id: "my-foods",    label: "My foods"    },
  { id: "my-meals",   label: "My meals"    },
  { id: "favourites", label: "Favourites"  },
];

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label="Log meal tabs"
      className="flex items-center gap-1 bg-surface-raised rounded-lg p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 py-2 text-sm rounded-md transition-all font-medium",
            active === tab.id
              ? "bg-white shadow-sm text-foreground"
              : "text-muted hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
