import { apiRequest } from "./client";

// GET /api/v1/jobRecommendation -> { items, hasNext, lastScore, lastId }
// Pass the cursor from the previous page to get the next one.
export function getRecommendations(cursor, size) {
  const params = new URLSearchParams();
  params.set("size", String(size));
  if (cursor) {
    params.set("lastScore", String(cursor.lastScore));
    params.set("lastId", String(cursor.lastId));
  }
  return apiRequest("/api/v1/jobRecommendation?" + params.toString());
}

// PATCH /api/v1/jobRecommendation/{id}  status: NEW | VIEWED | SAVED | DISMISSED
export function setRecommendationStatus(recommendationId, status) {
  return apiRequest("/api/v1/jobRecommendation/" + recommendationId, {
    method: "PATCH",
    body: { recommendationStatus: status },
  });
}
