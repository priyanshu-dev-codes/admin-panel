const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/+$/, "");

export function apiUrl(path: string) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function parseResponse<T>(res: Response): Promise<T> {
  const raw = await res.text();

  let data: any;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `Backend returned non-JSON (${res.status}). Check API origin and deployment.`
    );
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data as T;
}

export function csvCell(value: unknown) {
  const s = String(value ?? "");

  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}
