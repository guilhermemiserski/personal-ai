import { NextResponse } from "next/server";

const UPSTREAM_TIMEOUT_MS = 25_000;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const health = await fetch(`${origin}/health`, {
      cache: "no-store",
      signal: controller.signal,
    });
    const body = (await health.json().catch(() => ({}))) as {
      status?: string;
      groq_configured?: boolean;
    };
    const trainerApi = health.ok && body.status === "ok";
    const groqConfigured = body.groq_configured === true;

    return NextResponse.json({
      ok: trainerApi,
      groq_configured: groqConfigured,
      web_version: process.env.npm_package_version ?? "0.1.0",
      api_proxy_url: origin,
      upstream_status: health.status,
      upstream_health: body,
      hint: !trainerApi
        ? "A URL da API não retornou /health com {status:'ok'}. Verifique DATABASE_URL e JWT_SECRET no serviço."
        : !groqConfigured
          ? "API no ar, mas GROQ_API_KEY não está configurada — planos e coach usam fallback local."
          : "API do Personal AI Trainer respondeu corretamente com IA Groq ativa.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        api_proxy_url: origin,
        detail:
          "Falha ao conectar na API upstream. No plano gratuito do Render, o primeiro acesso pode levar até 1 minuto (cold start).",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
