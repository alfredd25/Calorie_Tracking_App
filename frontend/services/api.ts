const API_BASE = "http://localhost:8000";

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
  user_id: number,
  date: string,
  meal_type: "breakfast" | "lunch" | "dinner" | "snack"
) {
  const res = await fetch(`${API_BASE}/meals/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ user_id, date, meal_type }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { meal_id }
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

export async function getDaySummary(user_id: number, date: string) {
  const res = await fetch(
    `${API_BASE}/meals/day-summary?user_id=${user_id}&date=${date}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw await res.json();
  return res.json(); // MealSummary
}

export async function listMeals(user_id: number, date: string) {
  const res = await fetch(
    `${API_BASE}/meals/list?user_id=${user_id}&date=${date}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw await res.json();
  return res.json();
}