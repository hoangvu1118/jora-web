import { apiRequest } from "./client";

// GET /api/v1/job/{id} -> JobDetailResponse
export function getJob(jobId) {
  return apiRequest("/api/v1/job/" + jobId);
}
