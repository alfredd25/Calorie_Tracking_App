export interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealSummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}

export interface Meal {
  meal_id: number;
}