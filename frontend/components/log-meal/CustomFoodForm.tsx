"use client";

import { CustomFood, CustomFoodInput } from "@/types/custom";
import { useEffect, useState } from "react";

interface CustomFoodFormProps {
  initial?: CustomFood | null;
  onSubmit: (input: CustomFoodInput) => void | Promise<void>;
  submitLabel?: string;
}

// Form state holds raw strings so the user can freely backspace/clear fields.
interface FormState {
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

const EMPTY: FormState = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

const NUMERIC_RE = /^(\d+\.?\d*|\.\d*)?$/;

function fromInitial(initial: CustomFood | null | undefined): FormState {
  if (!initial) return EMPTY;
  return {
    name: initial.name,
    calories: String(initial.calories ?? ""),
    protein: String(initial.protein ?? ""),
    carbs: String(initial.carbs ?? ""),
    fat: String(initial.fat ?? ""),
  };
}

function toNumber(value: string): number {
  if (value === "" || value === ".") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function CustomFoodForm({
  initial,
  onSubmit,
  submitLabel = "Save",
}: CustomFoodFormProps) {
  const [form, setForm] = useState<FormState>(() => fromInitial(initial));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(fromInitial(initial));
  }, [initial]);

  const updateText = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateNumeric = (key: keyof FormState, value: string) => {
    if (NUMERIC_RE.test(value)) {
      setForm((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        calories: toNumber(form.calories),
        protein: toNumber(form.protein),
        carbs: toNumber(form.carbs),
        fat: toNumber(form.fat),
      });
    } catch (err: any) {
      setError(err?.detail || "Failed to save food");
    } finally {
      setSubmitting(false);
    }
  };

  const numField = (
    label: string,
    key: keyof Omit<FormState, "name">,
    suffix: string
  ) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-slate-600 font-medium">{label}</span>
      <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={form[key]}
          onChange={(e) => updateNumeric(key, e.target.value)}
          placeholder="0"
          className="flex-1 bg-transparent text-slate-900 px-3 py-2 outline-none text-sm placeholder:text-slate-400"
        />
        <span className="text-xs text-slate-500 px-3">{suffix}</span>
      </div>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-600 font-medium">Food name</span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateText("name", e.target.value)}
          placeholder="e.g. Greek yogurt"
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {numField("Calories", "calories", "kcal")}
        {numField("Protein", "protein", "g")}
        {numField("Carbohydrates", "carbs", "g")}
        {numField("Fat", "fat", "g")}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded-full disabled:opacity-50 mt-2 hover:bg-green-600 transition-colors shadow-sm"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
