import { apiRequest } from "./client";

// POST /api/v1/auth/login -> { username, token, userId }
export function login(email, password) {
  return apiRequest("/api/v1/auth/login", { method: "POST", body: { email, password } });
}

// POST /api/v1/auth/register -> { email, role }  (no token, so we log in right after)
export function register(email, password) {
  return apiRequest("/api/v1/auth/register", { method: "POST", body: { email, password } });
}
