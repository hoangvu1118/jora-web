import { ApiError, apiRequest } from "./client";

// ---------- Endpoints that exist today ----------

// POST /api/v1/resume (multipart, field "file") -> { id, fileName, fileSize, fileType }
export function uploadResume(file) {
  const form = new FormData();
  form.append("file", file);
  return apiRequest("/api/v1/resume", { method: "POST", body: form });
}

// POST /api/v1/resume/{id}/extract -> raw text
export function extractResume(resumeId) {
  return apiRequest("/api/v1/resume/" + resumeId + "/extract", { method: "POST" });
}

// POST /api/v1/resume/{id}/versions -> BASE version (Gemini, about 10 s)
export function createBaseVersion(resumeId) {
  return apiRequest("/api/v1/resume/" + resumeId + "/versions", { method: "POST" });
}

// GET /api/v1/resume/{id}/versions/{versionId} -> { id, type, status, content }
export function getVersion(resumeId, versionId) {
  return apiRequest("/api/v1/resume/" + resumeId + "/versions/" + versionId);
}

// POST /api/v1/resume/{id}/archive -> 204
export function archiveResume(resumeId) {
  return apiRequest("/api/v1/resume/" + resumeId + "/archive", { method: "POST" });
}

// POST /api/v1/resume/{id}/tailor/{jobId} -> TAILORED version (201 new, 200 existing)
export function tailorResume(resumeId, jobId) {
  return apiRequest("/api/v1/resume/" + resumeId + "/tailor/" + jobId, { method: "POST" });
}

// ---------- Endpoints the backend still needs (see README, "Backend to add") ----------

// GET /api/v1/resume/current
//   -> { id, fileName, createdAt, baseVersion: { id, type, status, content } or null }
//   -> 404 when the user has no active resume (returns null here)
export async function getCurrentResume() {
  try {
    return await apiRequest("/api/v1/resume/current");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

// GET /api/v1/resume/{id}/versions?type=TAILORED
//   -> [ { id, status, jobId, jobTitle, companyName, createdAt } ]  newest first
export function getTailoredVersions(resumeId) {
  return apiRequest("/api/v1/resume/" + resumeId + "/versions?type=TAILORED");
}

// POST /api/v1/resume/{id}/versions/{versionId}/final -> the version, now FINAL
export function markVersionFinal(resumeId, versionId) {
  return apiRequest("/api/v1/resume/" + resumeId + "/versions/" + versionId + "/final", { method: "POST" });
}
