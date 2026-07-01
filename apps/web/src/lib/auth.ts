const SESSION_KEY = "personal_ai_session";
const TOKEN_SESSION_KEY = "pa_bearer_session";

let inMemoryAccessToken: string | null = null;

function safeSessionGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode / storage blocked — in-memory token still works until reload.
  }
}

function safeSessionRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readStoredToken(): string | null {
  return safeSessionGet(TOKEN_SESSION_KEY);
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    safeSessionSet(TOKEN_SESSION_KEY, token);
  } else {
    safeSessionRemove(TOKEN_SESSION_KEY);
  }
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  return readStoredToken();
}

export function markAuthenticated(): void {
  safeSessionSet(SESSION_KEY, "1");
}

export function clearSession(): void {
  safeSessionRemove(SESSION_KEY);
  safeSessionRemove(TOKEN_SESSION_KEY);
  inMemoryAccessToken = null;
}

export function hasSessionHint(): boolean {
  return safeSessionGet(SESSION_KEY) === "1";
}
