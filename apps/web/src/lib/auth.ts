const SESSION_KEY = "personal_ai_session";
const TOKEN_SESSION_KEY = "pa_bearer_session";

let inMemoryAccessToken: string | null = null;

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_SESSION_KEY);
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (typeof window === "undefined") return;
  if (token) {
    sessionStorage.setItem(TOKEN_SESSION_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
  }
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  return readStoredToken();
}

export function markAuthenticated(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(TOKEN_SESSION_KEY);
  inMemoryAccessToken = null;
}

export function hasSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}
