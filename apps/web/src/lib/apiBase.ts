/** Browser always uses same-origin `/api` so httpOnly auth cookies work in dev and production. */
export function resolveApiUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }

  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const proxy = process.env.API_PROXY_URL?.replace(/\/$/, "");
  if (proxy) {
    return proxy;
  }
  if (configured?.startsWith("http")) {
    return configured;
  }
  return configured ?? "http://127.0.0.1:8000";
}
