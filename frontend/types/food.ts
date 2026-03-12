export interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealSummary {
  user_id: number;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  meal_id: number;
}