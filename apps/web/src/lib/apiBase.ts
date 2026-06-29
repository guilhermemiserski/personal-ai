/** Browser always uses same-origin `/api` so httpOnly auth cookies work in dev and production. */
export function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    if (configured?.startsWith("/")) {
      return configured;
    }
    return "/api";
  }

  const proxy = process.env.API_PROXY_URL?.replace(/\/$/, "");
  if (proxy) {
    return proxy;
  }
  if (configured?.startsWith("http")) {
    return configured;
  }
  return "http://127.0.0.1:8000";
}
