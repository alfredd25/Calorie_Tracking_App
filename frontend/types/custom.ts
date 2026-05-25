export interface CustomFood {
  id: number;
  user_id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
}

export interface CustomFoodInput {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type FoodSource = "custom" | "database";

export interface CustomMealItem {
  id: number;
  source: FoodSource;
  food_id: number;
  quantity: number;
}

export interface CustomMealItemInput {
  source: FoodSource;
  food_id: number;
  quantity: number;
}

export interface CustomMeal {
  id: number;
  user_id: number;
  name: string;
  items: CustomMealItem[];
  total_kcal: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  created_at: string;
}

export interface CustomMealInput {
  name: string;
  items: CustomMealItemInput[];
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
