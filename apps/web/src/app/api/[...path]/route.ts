import { NextRequest, NextResponse } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

const UPSTREAM_TIMEOUT_MS = 25_000;

function apiOrigin(): string {
  const configured = process.env.API_PROXY_URL?.trim();
  if (!configured) {
    return "";
  }
  return configured.replace(/\/$/, "");
}

function proxyConfigError(): string | null {
  if (!process.env.API_PROXY_URL?.trim()) {
    return "API_PROXY_URL não está definido. Em produção use http://127.0.0.1:8000 (API no mesmo container).";
  }
  return null;
}

function rewriteCookieForWebHost(cookie: string): string {
  return cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.toLowerCase().startsWith("domain="))
    .join("; ");
}

function forwardUpstreamHeaders(upstream: Response, responseHeaders: Headers): void {
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower) || lower === "set-cookie") {
      return;
    }
    responseHeaders.append(key, value);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", rewriteCookieForWebHost(cookie));
    }
    return;
  }

  const fallbackCookie = upstream.headers.get("set-cookie");
  if (fallbackCookie) {
    responseHeaders.append("set-cookie", rewriteCookieForWebHost(fallbackCookie));
  }
}

function proxyFailureResponse(status: number, detail: string): NextResponse {
  return NextResponse.json({ detail }, { status });
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const configError = proxyConfigError();
  if (configError) {
    return proxyFailureResponse(503, configError);
  }

  const { path } = await context.params;
  const targetUrl = `${apiOrigin()}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower) || lower === "host") {
      return;
    }
    headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstreamController = new AbortController();
  const upstreamTimeoutId = setTimeout(() => upstreamController.abort(), UPSTREAM_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, { ...init, signal: upstreamController.signal });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return proxyFailureResponse(
      503,
      isTimeout
        ? "A API demorou para responder (cold start no Render). Aguarde ~1 minuto e tente novamente."
        : "Não foi possível conectar à API. Verifique se o serviço da API está no ar e se API_PROXY_URL está correto.",
    );
  } finally {
    clearTimeout(upstreamTimeoutId);
  }

  const responseHeaders = new Headers();
  forwardUpstreamHeaders(upstream, responseHeaders);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const runtime = "nodejs";
export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
