import { ApiError, apiRequest } from "./client";

// GET /api/v1/searchProfiles -> SearchProfileResponse, or null when the user has none yet.
export async function getSearchProfile() {
  try {
    return await apiRequest("/api/v1/searchProfiles");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// POST /api/v1/searchProfiles (first time)
export function createSearchProfile(profile) {
  return apiRequest("/api/v1/searchProfiles", { method: "POST", body: profile });
}

// PATCH /api/v1/searchProfiles (every time after)
export function updateSearchProfile(profile) {
  return apiRequest("/api/v1/searchProfiles", { method: "PATCH", body: profile });
}
