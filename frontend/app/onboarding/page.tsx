"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, Check, AlertCircle,
  User, Activity, Flame, Dumbbell, Scale, Heart,
} from "lucide-react";

const inputCls =
  "w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 placeholder:text-subtle transition-all";

const labelCls = "block text-xs font-medium text-muted uppercase tracking-wider mb-1.5";

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex bg-surface-raised rounded-md p-0.5 text-xs">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-2.5 py-1 rounded transition-colors font-medium ${
            value === opt ? "bg-white shadow-sm text-foreground" : "text-muted hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [heightMode, setHeightMode] = useState<"cm" | "ft">("cm");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [heightFt, setHeightFt] = useState<number | "">("");
  const [heightIn, setHeightIn] = useState<number | "">("");
  const [weightMode, setWeightMode] = useState<"kg" | "lbs">("kg");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [weightLbs, setWeightLbs] = useState<number | "">("");

  const [goal, setGoal] = useState("");
  const [targetWeightMode, setTargetWeightMode] = useState<"kg" | "lbs">("kg");
  const [targetWeightKg, setTargetWeightKg] = useState<number | "">("");
  const [targetWeightLbs, setTargetWeightLbs] = useState<number | "">("");

  const [activityLevel, setActivityLevel] = useState("");

  const calculateTDEE = (wKg: number, hCm: number, age: number, gender: string, mult: number) => {
    let bmr = 10 * wKg + 6.25 * hCm - 5 * age;
    bmr += gender === "Male" ? 5 : -161;
    return bmr * mult;
  };

  const calculateTargetCalories = (tdee: number, goal: string) => {
    if (goal === "Lose Weight") return tdee - 500;
    if (goal === "Build Muscle") return tdee + 250;
    return tdee;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName || !age || !gender) return setError("Please fill all fields.");
      if (heightMode === "cm" && !heightCm) return setError("Please enter your height.");
      if (heightMode === "ft" && !heightFt && !heightIn) return setError("Please enter your height.");
      if (weightMode === "kg" && !weightKg) return setError("Please enter your weight.");
      if (weightMode === "lbs" && !weightLbs) return setError("Please enter your weight.");
      setError(""); setStep(2);
    } else if (step === 2) {
      if (!goal) return setError("Please select a goal.");
      setError(""); setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!activityLevel) return setError("Please select an activity level.");
    setLoading(true); setError("");
    try {
      const finalAge = Number(age);
      const finalHeightCm =
        heightMode === "cm" ? Number(heightCm) : Number(heightFt) * 30.48 + Number(heightIn) * 2.54;
      const finalWeightKg =
        weightMode === "kg" ? Number(weightKg) : Number(weightLbs) * 0.453592;

      let finalTargetWeightKg = null;
      if (goal === "Lose Weight" || goal === "Build Muscle") {
        if (targetWeightMode === "kg" && targetWeightKg) finalTargetWeightKg = Number(targetWeightKg);
        if (targetWeightMode === "lbs" && targetWeightLbs) finalTargetWeightKg = Number(targetWeightLbs) * 0.453592;
      }

      const multipliers: Record<string, number> = {
        Sedentary: 1.2, "Lightly Active": 1.375, "Moderately Active": 1.55,
        "Very Active": 1.725, "Extremely Active": 1.9,
      };

      const tdee = calculateTDEE(finalWeightKg, finalHeightCm, finalAge, gender, multipliers[activityLevel] || 1.2);
      const dailyCalorieTarget = calculateTargetCalories(tdee, goal);

      const profileData = {
        full_name: fullName, age: finalAge, gender,
        height_cm: finalHeightCm, weight_kg: finalWeightKg, goal,
        target_weight_kg: finalTargetWeightKg, activity_level: activityLevel,
        tdee,
        daily_calorie_target: dailyCalorieTarget,
        target_protein: (dailyCalorieTarget * 0.30) / 4,
        target_carbs: (dailyCalorieTarget * 0.40) / 4,
        target_fat: (dailyCalorieTarget * 0.30) / 9,
        onboarding_complete: true,
      };

      const token = localStorage.getItem("token");
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) throw new Error("Failed to save profile.");
      router.push("/welcome");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const steps = ["About you", "Your goal", "Activity"];

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-start py-10 px-4">
        {/* Progress */}
        <div className="w-full max-w-lg mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 text-sm">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border transition-colors ${
                    step > i + 1
                      ? "bg-foreground border-foreground text-white"
                      : step === i + 1
                      ? "border-foreground text-foreground"
                      : "border-border text-muted"
                  }`}
                >
                  {step > i + 1 ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                <span className={step === i + 1 ? "text-foreground font-medium" : "text-muted"}>
                  {s}
                </span>
              </div>
            ))}
          </div>
          <div className="h-px bg-border w-full">
            <div
              className="h-px bg-foreground transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="w-full max-w-lg bg-white border border-border rounded-xl p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">About you</h1>
                <p className="text-sm text-muted mt-1">We use this to calculate your targets.</p>
              </div>

              <div>
                <label className={labelCls}>Full name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name" className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Age</label>
                  <input type="number" min="10" max="100" value={age}
                    onChange={(e) => setAge(Number(e.target.value))} placeholder="25" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}
                    className={inputCls + " text-foreground"}>
                    <option value="" disabled>Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls + " mb-0"}>Height</label>
                  <UnitToggle value={heightMode} options={["cm", "ft"]} onChange={(v) => setHeightMode(v as "cm" | "ft")} />
                </div>
                {heightMode === "cm" ? (
                  <input type="number" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))}
                    placeholder="175" className={inputCls} />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input type="number" value={heightFt} onChange={(e) => setHeightFt(Number(e.target.value))}
                        placeholder="5" className={inputCls} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">ft</span>
                    </div>
                    <div className="relative">
                      <input type="number" value={heightIn} onChange={(e) => setHeightIn(Number(e.target.value))}
                        placeholder="10" className={inputCls} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">in</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls + " mb-0"}>Weight</label>
                  <UnitToggle value={weightMode} options={["kg", "lbs"]} onChange={(v) => setWeightMode(v as "kg" | "lbs")} />
                </div>
                {weightMode === "kg" ? (
                  <input type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))}
                    placeholder="70" className={inputCls} />
                ) : (
                  <input type="number" value={weightLbs} onChange={(e) => setWeightLbs(Number(e.target.value))}
                    placeholder="154" className={inputCls} />
                )}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">What's your goal?</h1>
                <p className="text-sm text-muted mt-1">This sets your daily calorie target.</p>
              </div>

              <div className="space-y-2">
                {[
                  { id: "Lose Weight",     Icon: Flame,    desc: "Calorie deficit to reduce body fat" },
                  { id: "Build Muscle",    Icon: Dumbbell, desc: "Calorie surplus for lean mass" },
                  { id: "Maintain Weight", Icon: Scale,    desc: "Stay at your current weight" },
                  { id: "Improve Fitness", Icon: Activity, desc: "Eat to perform and recover better" },
                  { id: "Eat Healthier",   Icon: Heart,    desc: "Improve overall diet quality" },
                ].map(({ id, Icon, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setGoal(id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border text-left transition-all ${
                      goal === id
                        ? "border-foreground bg-foreground/[0.03]"
                        : "border-border hover:border-border-strong hover:bg-surface-raised"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                      goal === id ? "bg-foreground text-white" : "bg-surface-raised text-muted"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{id}</p>
                      <p className="text-xs text-muted">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {(goal === "Lose Weight" || goal === "Build Muscle") && (
                <div className="animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls + " mb-0"}>Target weight (optional)</label>
                    <UnitToggle value={targetWeightMode} options={["kg", "lbs"]}
                      onChange={(v) => setTargetWeightMode(v as "kg" | "lbs")} />
                  </div>
                  {targetWeightMode === "kg" ? (
                    <input type="number" value={targetWeightKg} onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                      placeholder="65" className={inputCls} />
                  ) : (
                    <input type="number" value={targetWeightLbs} onChange={(e) => setTargetWeightLbs(Number(e.target.value))}
                      placeholder="145" className={inputCls} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">How active are you?</h1>
                <p className="text-sm text-muted mt-1">Used to estimate your daily calorie burn.</p>
              </div>

              <div className="space-y-2">
                {[
                  { id: "Sedentary",         desc: "Little or no exercise, desk job" },
                  { id: "Lightly Active",    desc: "Light exercise 1–3 days per week" },
                  { id: "Moderately Active", desc: "Moderate exercise 3–5 days per week" },
                  { id: "Very Active",       desc: "Hard exercise 6–7 days per week" },
                  { id: "Extremely Active",  desc: "Intense daily exercise or physical job" },
                ].map(({ id, desc }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActivityLevel(id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-lg border text-left transition-all ${
                      activityLevel === id
                        ? "border-foreground bg-foreground/[0.03]"
                        : "border-border hover:border-border-strong hover:bg-surface-raised"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{id}</p>
                      <p className="text-xs text-muted">{desc}</p>
                    </div>
                    {activityLevel === id && (
                      <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => { setStep(step - 1); setError(""); }}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={step === 3 ? handleFinish : handleNext}
              disabled={loading}
              className="flex items-center gap-2 bg-foreground text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === 3 ? (
                <>Finish <Check className="w-4 h-4" /></>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
