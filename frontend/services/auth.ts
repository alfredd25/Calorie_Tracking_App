export function saveToken(token: string): void {
  localStorage.setItem("token", token);
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

export function saveUserId(id: number): void {
  localStorage.setItem("user_id", String(id));
}

export function getUserId(): number | null {
  const id = localStorage.getItem("user_id");
  return id ? parseInt(id) : null;
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
}