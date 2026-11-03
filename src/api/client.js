// The one place that talks to the Spring Boot API.
// Every other api/*.js file calls apiRequest(); pages never call fetch() directly.

const API_URL = import.meta.env.VITE_API_URL || "";
const TOKEN_KEY = "jora.token";

// An error the page can show to the user. `status` is the HTTP status (0 = no connection).
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// options: { method: "POST", body: {...} or FormData }
export async function apiRequest(path, options = {}) {
  const method = options.method || "GET";
  const headers = {};
  let body = options.body;

  const token = getToken();
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }

  // Plain objects are sent as JSON. FormData (file upload) is sent as it is.
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(API_URL + path, { method, headers, body });
  } catch {
    throw new ApiError(0, "Can't reach Jora right now. Check your connection and try again.");
  }

  // The token is missing or expired: go back to the login page.
  if (response.status === 401 || response.status === 403) {
    if (token) {
      clearToken();
      window.location.assign("/login");
    }
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new ApiError(response.status, message);
  }

  return readBody(response);
}

async function readBody(response) {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (text === "") {
    return null;
  }
  // Most endpoints return JSON. /extract returns plain text, so fall back to the text.
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// The backend answers errors as ProblemDetail: { title, status, detail }.
async function readErrorMessage(response) {
  try {
    const problem = await response.json();
    if (problem.detail) {
      return problem.detail;
    }
    if (problem.title) {
      return problem.title;
    }
  } catch {
    // Not JSON: use the generic message below.
  }
  return "Something went wrong (" + response.status + "). Please try again.";
}
