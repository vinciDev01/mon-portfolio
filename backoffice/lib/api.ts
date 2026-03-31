const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getApiUrl(): string {
  return API_URL;
}

export function getFileUrl(path: string | null): string | null {
  if (!path) return null;
  return `${API_URL}/uploads/${path}`;
}

export async function fetchEntities<T>(entity: string): Promise<T[]> {
  const res = await fetch(`${API_URL}/api/${entity}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}`);
  return res.json();
}

export async function fetchEntity<T>(entity: string, id: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/${entity}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}/${id}`);
  return res.json();
}

export async function fetchSingleton<T>(entity: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/${entity}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}`);
  return res.json();
}

export async function createEntity<T>(entity: string, data: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${API_URL}/api/${entity}`, {
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
    headers: isFormData ? {} : { "Content-Type": "application/json" },
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
    headers: isFormData ? {} : { "Content-Type": "application/json" },
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
    headers: isFormData ? {} : { "Content-Type": "application/json" },
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
  });
  if (!res.ok) throw new Error("Failed to upload file");
  const result = await res.json();
  return result.path;
}
