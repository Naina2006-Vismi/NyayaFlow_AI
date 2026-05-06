const API_BASE = "/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (_error) {
    throw new Error("API not reachable. Start the backend with `npm run start:api` and refresh the page.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return response.json();
}

export function fetchSummary() {
  return request("/summary");
}

export function fetchDashboard() {
  return request("/dashboard");
}

export function fetchSystem() {
  return request("/system");
}

export function fetchCases({ query = "", status = "all", department = "all", risk = "all" } = {}) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("status", status);
  params.set("department", department);
  params.set("risk", risk);
  return request(`/cases?${params.toString()}`);
}

export function fetchCase(id) {
  return request(`/cases/${id}`);
}

export function fetchActivity() {
  return request("/activity");
}

export function uploadDocument(file, mode = "auto") {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("mode", mode);
  return request("/uploads", {
    method: "POST",
    body: formData,
  });
}

export function updateCase(id, payload) {
  return request(`/cases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function reextractCase(id, mode = "auto") {
  return request(`/cases/${id}/reextract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode }),
  });
}
