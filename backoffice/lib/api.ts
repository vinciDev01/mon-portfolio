import { getToken, removeToken } from "@/lib/auth";

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
  const token = typeof window !== "undefined" ? getToken() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Appelle l'API avec le jeton de l'administrateur. Le garde du backoffice ne
 * verifie que la PRESENCE du jeton : un jeton expire (7 jours) ou signe avec
 * un ancien `JWT_SECRET` laissait les pages s'ouvrir, puis chaque appel
 * echouait en « Erreur de chargement ». Un 401 efface donc le jeton et renvoie
 * a la connexion.
 */
export async function appelerApi(chemin: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_URL}${chemin}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), ...getAuthHeaders() },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    removeToken();
    if (window.location.pathname !== "/login") window.location.replace("/login");
  }
  return res;
}

export async function fetchEntities<T>(entity: string): Promise<T[]> {
  const res = await appelerApi(`/api/${entity}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}`);
  return res.json();
}

export async function fetchEntity<T>(entity: string, id: string): Promise<T> {
  const res = await appelerApi(`/api/${entity}/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}/${id}`);
  return res.json();
}

export async function fetchSingleton<T>(entity: string): Promise<T> {
  const res = await appelerApi(`/api/${entity}`);
  if (!res.ok) throw new Error(`Failed to fetch ${entity}`);
  return res.json();
}

export async function createEntity<T>(entity: string, data: FormData | Record<string, unknown>): Promise<T> {
  const isFormData = data instanceof FormData;
  const res = await appelerApi(`/api/${entity}`, {
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
  const res = await appelerApi(`/api/${entity}/${id}`, {
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
  const res = await appelerApi(`/api/${entity}`, {
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
  const res = await appelerApi(`/api/${entity}/${id}`, {
    method: "DELETE",
  });
  // Le message de l'API passe tel quel : un refus (409, une technologie qui
  // a des cours) doit dire pourquoi.
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to delete ${entity}/${id}`);
  }
}

/** Le PDF d'un cours : envoye a part, range hors du dossier public. L'API
 *  rend son nom, sa taille et ses pages lues ; le formulaire les reprend. */
export async function uploadCoursPdf(
  file: File,
): Promise<{ fichier: string; taille: number; pages: number | null }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await appelerApi(`/api/cours/fichier`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Echec de l'envoi du PDF");
  }
  return res.json();
}

export async function uploadFile(file: File, category: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);
  const res = await appelerApi(`/api/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload file");
  const result = await res.json();
  return result.path;
}
