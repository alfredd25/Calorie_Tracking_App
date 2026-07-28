"use client";

import { CustomFood, CustomFoodInput } from "@/types/custom";
import { useEffect, useState } from "react";

interface CustomFoodFormProps {
  initial?: CustomFood | null;
  onSubmit: (input: CustomFoodInput) => void | Promise<void>;
  submitLabel?: string;
}

interface FormState {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const EMPTY: FormState = { name: "", calories: "", protein: "", carbs: "", fat: "" };
const NUMERIC_RE = /^(\d+\.?\d*|\.\d*)?$/;

function fromInitial(initial?: CustomFood | null): FormState {
  if (!initial) return EMPTY;
  return {
    name:     initial.name,
    calories: String(initial.calories ?? ""),
    protein:  String(initial.protein  ?? ""),
    carbs:    String(initial.carbs    ?? ""),
    fat:      String(initial.fat      ?? ""),
  };
}

function toNumber(value: string): number {
  if (value === "" || value === ".") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const fieldCls = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all";
const labelCls = "block text-xs font-medium text-muted uppercase tracking-wider mb-1.5";

export function CustomFoodForm({ initial, onSubmit, submitLabel = "Save" }: CustomFoodFormProps) {
  const [form, setForm] = useState<FormState>(() => fromInitial(initial));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setForm(fromInitial(initial)); }, [initial]);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setNum = (key: keyof FormState, value: string) => {
    if (NUMERIC_RE.test(value)) setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        name:     form.name.trim(),
        calories: toNumber(form.calories),
        protein:  toNumber(form.protein),
        carbs:    toNumber(form.carbs),
        fat:      toNumber(form.fat),
      });
    } catch (err: any) {
      setError(err?.detail || "Failed to save food");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Food name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Greek yogurt"
          className={fieldCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { key: "calories", label: "Calories", suffix: "kcal" },
            { key: "protein",  label: "Protein",  suffix: "g"    },
            { key: "carbs",    label: "Carbs",    suffix: "g"    },
            { key: "fat",      label: "Fat",       suffix: "g"    },
          ] as { key: keyof Omit<FormState, "name">; label: string; suffix: string }[]
        ).map(({ key, label, suffix }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <div className="flex items-center border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-foreground/10 focus-within:border-foreground/30 bg-background">
              <input
                type="text"
                inputMode="decimal"
                value={form[key]}
                onChange={(e) => setNum(key, e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-subtle"
              />
              <span className="text-xs text-subtle px-2.5">{suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-foreground text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 hover:bg-zinc-700 transition-colors mt-2"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
