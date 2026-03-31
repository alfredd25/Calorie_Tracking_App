"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Activity, Target, ArrowRight, ArrowLeft, Check, Flame, Dumbbell, Scale, Heart, Sparkles, AlertCircle } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Basic Details
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

  // Step 2: Goal
  const [goal, setGoal] = useState("");
  const [targetWeightMode, setTargetWeightMode] = useState<"kg" | "lbs">("kg");
  const [targetWeightKg, setTargetWeightKg] = useState<number | "">("");
  const [targetWeightLbs, setTargetWeightLbs] = useState<number | "">("");

  // Step 3: Activity Level
  const [activityLevel, setActivityLevel] = useState("");

  const calculateTDEE = (currentWeightKg: number, currentHeightCm: number, age: number, gender: string, activityMultiplier: number) => {
    // Mifflin-St Jeor Equation
    let bmr = 10 * currentWeightKg + 6.25 * currentHeightCm - 5 * age;
    bmr += gender === "Male" ? 5 : -161;
    return bmr * activityMultiplier;
  };

  const calculateTargetCalories = (tdee: number, goal: string) => {
    switch (goal) {
      case "Lose Weight": return tdee - 500;
      case "Build Muscle": return tdee + 250;
      case "Maintain Weight":
      case "Improve Fitness":
      case "Eat Healthier":
      default: return tdee;
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName || !age || !gender) return setError("Please fill all fields.");
      if (heightMode === "cm" && !heightCm) return setError("Please enter your height.");
      if (heightMode === "ft" && (!heightFt && !heightIn)) return setError("Please enter your height.");
      if (weightMode === "kg" && !weightKg) return setError("Please enter your weight.");
      if (weightMode === "lbs" && !weightLbs) return setError("Please enter your weight.");
      setError("");
      setStep(2);
    } else if (step === 2) {
      if (!goal) return setError("Please select a goal.");
      setError("");
      setStep(3);
    }
  };

  const handleFinish = async () => {
    if (!activityLevel) return setError("Please select an activity level.");
    setLoading(true);
    setError("");

    try {
      // Calculate final inputs in Metric
      const finalAge = Number(age);
      const finalHeightCm = heightMode === "cm" ? Number(heightCm) : (Number(heightFt) * 30.48) + (Number(heightIn) * 2.54);
      const finalWeightKg = weightMode === "kg" ? Number(weightKg) : Number(weightLbs) * 0.453592;
      
      let finalTargetWeightKg = null;
      if (goal === "Lose Weight" || goal === "Build Muscle") {
        if (targetWeightMode === "kg" && targetWeightKg) finalTargetWeightKg = Number(targetWeightKg);
        if (targetWeightMode === "lbs" && targetWeightLbs) finalTargetWeightKg = Number(targetWeightLbs) * 0.453592;
      }

      const mutlipliers: Record<string, number> = {
        "Sedentary": 1.2,
        "Lightly Active": 1.375,
        "Moderately Active": 1.55,
        "Very Active": 1.725,
        "Extremely Active": 1.9
      };
      
      const tdee = calculateTDEE(finalWeightKg, finalHeightCm, finalAge, gender, mutlipliers[activityLevel] || 1.2);
      const dailyCalorieTarget = calculateTargetCalories(tdee, goal);

      // 40/30/30 (Carbs/Protein/Fat) split
      const targetProtein = (dailyCalorieTarget * 0.30) / 4;
      const targetCarbs = (dailyCalorieTarget * 0.40) / 4;
      const targetFat = (dailyCalorieTarget * 0.30) / 9;

      const profileData = {
        full_name: fullName,
        age: finalAge,
        gender,
        height_cm: finalHeightCm,
        weight_kg: finalWeightKg,
        goal,
        target_weight_kg: finalTargetWeightKg,
        activity_level: activityLevel,
        tdee: tdee,
        daily_calorie_target: dailyCalorieTarget,
        target_protein: targetProtein,
        target_carbs: targetCarbs,
        target_fat: targetFat,
        onboarding_complete: true
      };

      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileData)
      });

      if (!res.ok) {
        throw new Error("Failed to save profile.");
      }

      router.push("/welcome");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center py-6 md:py-12 overflow-y-auto px-4">
      {/* Progress Indicator */}
      <div className="w-full max-w-2xl mb-8 flex flex-col items-center">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-400 mb-2">
          <span className={step >= 1 ? "text-primary" : ""}>Step 1</span>
          <span>•</span>
          <span className={step >= 2 ? "text-primary" : ""}>Step 2</span>
          <span>•</span>
          <span className={step >= 3 ? "text-primary" : ""}>Step 3</span>
        </div>
        <div className="w-full bg-slate-200 h-2 flex rounded-full overflow-hidden">
          <div className={`bg-primary h-full transition-all duration-500 ease-in-out`} style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-slate-100 relative min-h-[500px] flex flex-col">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center text-sm font-medium">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* STEP 1: Basic Details */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900">Let's get to know you</h1>
              <p className="text-slate-500 mt-2 font-medium">We need some basics to calculate your optimal targets.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Age</label>
                  <input type="number" min="10" max="100" value={age} onChange={e => setAge(Number(e.target.value))} placeholder="Years" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">Gender</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-slate-700">
                    <option value="" disabled>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-700">Height</label>
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setHeightMode("cm")} className={`px-3 py-1 text-xs font-bold rounded-md ${heightMode === "cm" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>cm</button>
                    <button onClick={() => setHeightMode("ft")} className={`px-3 py-1 text-xs font-bold rounded-md ${heightMode === "ft" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>ft & in</button>
                  </div>
                </div>
                {heightMode === "cm" ? (
                  <input type="number" value={heightCm} onChange={e => setHeightCm(Number(e.target.value))} placeholder="175" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative"><input type="number" value={heightFt} onChange={e => setHeightFt(Number(e.target.value))} placeholder="5" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">ft</span></div>
                    <div className="relative"><input type="number" value={heightIn} onChange={e => setHeightIn(Number(e.target.value))} placeholder="10" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium" /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">in</span></div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-700">Weight</label>
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setWeightMode("kg")} className={`px-3 py-1 text-xs font-bold rounded-md ${weightMode === "kg" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>kg</button>
                    <button onClick={() => setWeightMode("lbs")} className={`px-3 py-1 text-xs font-bold rounded-md ${weightMode === "lbs" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>lbs</button>
                  </div>
                </div>
                {weightMode === "kg" ? (
                  <input type="number" value={weightKg} onChange={e => setWeightKg(Number(e.target.value))} placeholder="70" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
                ) : (
                  <input type="number" value={weightLbs} onChange={e => setWeightLbs(Number(e.target.value))} placeholder="154" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Goal */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900">What's your goal?</h1>
              <p className="text-slate-500 mt-2 font-medium">This helps us calculate your ideal daily calorie target.</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "Lose Weight", icon: Flame, text: "Reduce body fat with a calorie deficit", color: "text-orange-500", bg: "bg-orange-100" },
                { id: "Build Muscle", icon: Dumbbell, text: "Gain lean mass with a calorie surplus", color: "text-blue-500", bg: "bg-blue-100" },
                { id: "Maintain Weight", icon: Scale, text: "Keep your current weight stable", color: "text-slate-600", bg: "bg-slate-200" },
                { id: "Improve Fitness", icon: Activity, text: "Eat to perform and recover better", color: "text-purple-500", bg: "bg-purple-100" },
                { id: "Eat Healthier", icon: Heart, text: "Improve diet quality and habits", color: "text-rose-500", bg: "bg-rose-100" },
              ].map(opt => (
                <button key={opt.id} onClick={() => setGoal(opt.id)} className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left ${goal === opt.id ? "border-primary bg-primary/5 shadow-md shadow-green-100" : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${opt.bg}`}>
                    <opt.icon className={`w-6 h-6 ${opt.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{opt.id}</h3>
                    <p className="text-slate-500 text-sm font-medium">{opt.text}</p>
                  </div>
                </button>
              ))}
            </div>

            {(goal === "Lose Weight" || goal === "Build Muscle") && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-slate-700">What's your target weight? (Optional)</label>
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setTargetWeightMode("kg")} className={`px-2 py-1 text-[10px] font-bold rounded-md ${targetWeightMode === "kg" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>kg</button>
                    <button onClick={() => setTargetWeightMode("lbs")} className={`px-2 py-1 text-[10px] font-bold rounded-md ${targetWeightMode === "lbs" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>lbs</button>
                  </div>
                </div>
                {targetWeightMode === "kg" ? (
                  <input type="number" value={targetWeightKg} onChange={e => setTargetWeightKg(Number(e.target.value))} placeholder="e.g. 65" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 font-medium" />
                ) : (
                  <input type="number" value={targetWeightLbs} onChange={e => setTargetWeightLbs(Number(e.target.value))} placeholder="e.g. 145" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 font-medium" />
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Activity Level */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-slate-900">How active are you?</h1>
              <p className="text-slate-500 mt-2 font-medium">We use this to estimate your daily calorie burn.</p>
            </div>

            <div className="space-y-3">
              {[
                { id: "Sedentary", emoji: "🛋️", desc: "Little or no exercise. Desk job." },
                { id: "Lightly Active", emoji: "🚶", desc: "Light exercise 1-3 days/week." },
                { id: "Moderately Active", emoji: "🏋️", desc: "Moderate exercise 3-5 days/week." },
                { id: "Very Active", emoji: "🔥", desc: "Hard exercise 6-7 days/week." },
                { id: "Extremely Active", emoji: "⚡", desc: "Intense daily exercise or physical job." },
              ].map(opt => (
                <button key={opt.id} onClick={() => setActivityLevel(opt.id)} className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left ${activityLevel === opt.id ? "border-primary bg-primary/5 shadow-md shadow-green-100" : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <div className="text-3xl mr-4">{opt.emoji}</div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{opt.id}</h3>
                    <p className="text-slate-500 text-sm font-medium">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => { setStep(step - 1); setError(""); }} className="flex items-center text-slate-500 font-bold hover:text-slate-800 transition-colors px-4 py-3">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
          ) : <div />}
          
          <button
            onClick={step === 3 ? handleFinish : handleNext}
            disabled={loading}
            className="flex items-center bg-primary text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-green-200 hover:bg-green-600 transition-all disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : step === 3 ? (
              <>Finish <Check className="w-5 h-5 ml-2" /></>
            ) : (
              <>Next <ArrowRight className="w-5 h-5 ml-2" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
