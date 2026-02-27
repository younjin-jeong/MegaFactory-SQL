/**
 * Base fetch wrapper for all API calls.
 *
 * Every proxy endpoint (`/proxy/megadb/*`, `/proxy/k8s/*`, `/proxy/prom/*`)
 * goes through these helpers so error handling is uniform.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`HTTP ${status}: ${body}`);
    this.name = "ApiError";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function apiPost<T, B = unknown>(
  path: string,
  body: B,
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(path, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text);
  }
}
