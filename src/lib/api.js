// Thin fetch wrapper for the MoSE DB API.
//
// - Reads the base URL from VITE_API_URL (set in .env.local), defaults to localhost:8000.
// - Auto-attaches Bearer token from localStorage when present.
// - Throws on non-2xx with a parsed message from the FastAPI `detail` field.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const TOKEN_KEY = 'mose_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, headers = {}, form = false } = {}) {
  const token = getToken();
  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(body).toString();
  } else if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers: finalHeaders, body: payload });
  } catch {
    throw new ApiError('Cannot reach the MoSE DB server. Is the backend running?', 0);
  }

  // 204 has no body
  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON; leave data as null */ }

  if (!res.ok) {
    const detail =
      typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
          ? data.detail.map((d) => d.msg).join(', ')
          : `Request failed (${res.status})`;
    throw new ApiError(detail, res.status);
  }
  return data;
}

// --- Auth -----------------------------------------------------------------

export async function login(username, password) {
  // FastAPI's OAuth2PasswordRequestForm wants form-urlencoded fields.
  const data = await request('/token', {
    method: 'POST',
    form: true,
    body: { username, password },
  });
  setToken(data.access_token);
  return data;
}

export const fetchMe = () => request('/users/me');

// --- Vulnerabilities ------------------------------------------------------

export const fetchCves = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/cves/${qs ? `?${qs}` : ''}`);
};

export const fetchCveGraph = (id) => request(`/cves/${id}/graph`);

// --- Graph view -----------------------------------------------------------

export const fetchGraphOverview = (cveLimit = 50) =>
  request(`/graph/overview?cve_limit=${cveLimit}`);

// --- Components / Attacks / Labs (read-only listing for now) -------------

export const fetchComponents = () => request('/components/');
export const fetchAttacks = () => request('/attacks/');
export const fetchLabs = () => request('/labs/');

// --- Bulk import ----------------------------------------------------------

export const importBundle = (bundle) =>
  request('/import/bundle', { method: 'POST', body: bundle });

export { ApiError };
