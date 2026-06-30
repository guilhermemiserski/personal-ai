import { NextResponse } from "next/server";

function apiOrigin(): string | null {
  const configured = process.env.API_PROXY_URL?.trim();
  if (!configured) {
    return null;
  }
  return configured.replace(/\/$/, "");
}

export async function GET(): Promise<NextResponse> {
  const origin = apiOrigin();
  if (!origin) {
    return NextResponse.json(
      {
        ok: false,
        detail: "API_PROXY_URL não configurado no serviço web.",
      },
      { status: 503 },
    );
  }

  try {
    const health = await fetch(`${origin}/health`, { cache: "no-store" });
    const body = (await health.json().catch(() => ({}))) as { status?: string };
    const trainerApi = health.ok && body.status === "ok";

    return NextResponse.json({
      ok: trainerApi,
      api_proxy_url: origin,
      upstream_status: health.status,
      upstream_health: body,
      hint: trainerApi
        ? "API do Personal AI Trainer respondeu corretamente."
        : "A URL da API não retornou /health com {status:'ok'}. Confirme que o serviço deployado é apps/api deste repositório (não outro projeto com nome parecido).",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        api_proxy_url: origin,
        detail: "Falha ao conectar na API upstream.",
      },
      { status: 503 },
    );
  }
}
