const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getApiUrl(): string {
  return API_URL;
}

export function getFileUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}/uploads/${path}`;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("portfolio-admin-token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function fetchEntities<T>(entity: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/api/${entity}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${entity}`);
  return res.json();
}

export async function fetchEntity<T>(entity: string, id: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/${entity}/${id}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${entity}/${id}`);
  return res.json();
}

export async function fetchSingleton<T>(entity: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/${entity}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${entity}`);
  return res.json();
}

export async function createEntity<T>(entity: string, data: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_URL}/api/${entity}`, {
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData
      ? { ...getAuthHeaders() }
      : { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create ${entity}`);
  }
  return res.json();
}

export async function updateEntity<T>(entity: string, id: string, data: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_URL}/api/${entity}/${id}`, {
    method: "PATCH",
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData
      ? { ...getAuthHeaders() }
      : { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update ${entity}`);
  }
  return res.json();
}

export async function updateSingleton<T>(entity: string, data: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_URL}/api/${entity}`, {
    method: "PATCH",
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData
      ? { ...getAuthHeaders() }
      : { "Content-Type": "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update ${entity}`);
  }
  return res.json();
}

export async function deleteEntity(entity: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/${entity}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Failed to delete ${entity}/${id}`);
}

export async function uploadFile(file: File, category: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: formData,
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to upload file");
  const result = await res.json();
  return result.path;
}
