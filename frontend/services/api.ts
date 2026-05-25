const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// --- Auth ---
export async function registerUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { access_token }
}

export async function forgotPassword(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function resetPassword(token: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function verifyResetToken(token: string) {
  const res = await fetch(
    `${API_BASE}/auth/verify-reset-token?token=${encodeURIComponent(token)}`
  );
  if (!res.ok) throw await res.json();
  return res.json(); // { valid: true }
}

// --- Foods ---
export async function searchFoods(query: string) {
  const res = await fetch(`${API_BASE}/foods/search?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // Food[]
}

export async function autocompleteFoods(query: string) {
  const res = await fetch(`${API_BASE}/foods/autocomplete?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // Food[]
}

// --- Meals ---
export async function createMeal(
  date: string,
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const res = await fetch(`${API_BASE}/meals/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date, meal_type }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function addFoodToMeal(
  meal_id: number,
  food_id: number,
  quantity: number
) {
  const res = await fetch(`${API_BASE}/meals/add-food`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ meal_id, food_id, quantity }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getDaySummary(date: string) {
  const res = await fetch(
    `${API_BASE}/meals/day-summary?date=${date}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function listMeals(date: string) {
  const res = await fetch(                      
    `${API_BASE}/meals/list?date=${date}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw await res.json();
  return res.json();
}


// --- Custom Foods (My Foods) ---
import type {
  CustomFood,
  CustomFoodInput,
  CustomMeal,
  CustomMealInput,
  MealType,
} from "@/types/custom";

export async function listCustomFoods(): Promise<CustomFood[]> {
  const res = await fetch(`${API_BASE}/custom-foods`, { headers: authHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createCustomFood(input: CustomFoodInput): Promise<CustomFood> {
  const res = await fetch(`${API_BASE}/custom-foods`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateCustomFood(
  id: number,
  input: Partial<CustomFoodInput>
): Promise<CustomFood> {
  const res = await fetch(`${API_BASE}/custom-foods/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteCustomFood(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/custom-foods/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw await res.json();
}

export async function logCustomFood(
  custom_food_id: number,
  date: string,
  meal_type: MealType,
  quantity = 1
) {
  const res = await fetch(`${API_BASE}/custom-foods/log`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ custom_food_id, date, meal_type, quantity }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// --- Custom Meals (My Meals) ---
export async function listCustomMeals(): Promise<CustomMeal[]> {
  const res = await fetch(`${API_BASE}/custom-meals`, { headers: authHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createCustomMeal(input: CustomMealInput): Promise<CustomMeal> {
  const res = await fetch(`${API_BASE}/custom-meals`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateCustomMeal(
  id: number,
  input: Partial<CustomMealInput>
): Promise<CustomMeal> {
  const res = await fetch(`${API_BASE}/custom-meals/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteCustomMeal(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/custom-meals/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) throw await res.json();
}

export async function logCustomMeal(
  meal_id: number,
  date: string,
  meal_type: MealType
) {
  const res = await fetch(`${API_BASE}/custom-meals/${meal_id}/log`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ date, meal_type }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
