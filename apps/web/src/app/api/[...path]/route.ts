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

function apiOrigin(): string {
  const configured = process.env.API_PROXY_URL?.trim();
  if (!configured) {
    return "";
  }
  return configured.replace(/\/$/, "");
}

function proxyConfigError(): string | null {
  if (!process.env.API_PROXY_URL?.trim()) {
    return "API_PROXY_URL não está definido no serviço web. Configure a URL pública da API (apps/api) no Render.";
  }
  return null;
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

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch {
    return proxyFailureResponse(
      503,
      "Não foi possível conectar à API. Verifique se o serviço da API está no ar e se API_PROXY_URL está correto.",
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) {
      return;
    }
    responseHeaders.append(key, value);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
