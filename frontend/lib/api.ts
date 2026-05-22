export type Sentiment = "Positive" | "Negative" | "Neutral";

export type Result = {
  id: string;
  text: string;
  polarity: number;
  sentiment: Sentiment;
  confidence: number;
  negative_words: string[];
  lime_html?: string;
  user?: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  email: string;
  is_admin: boolean;
};

const TOKEN_KEY = "sentiment_studio_token";
const USER_KEY = "sentiment_studio_user";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): { email: string; is_admin: boolean } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify({ email: auth.email, is_admin: auth.is_admin }));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
