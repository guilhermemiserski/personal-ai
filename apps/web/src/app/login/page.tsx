"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { resolveApiUrl } from "@/lib/apiBase";
import { markAuthenticated } from "@/lib/auth";
import { AuthFooter, AuthShell } from "@/components/AuthShell";
import { AuthPageSkeleton } from "@/components/skeleton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${resolveApiUrl()}/health`, { credentials: "include" })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setWaking(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      markAuthenticated();
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  }

  if (loading || waking) {
    return <AuthPageSkeleton />;
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse seu treinador personalizado">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-400">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="mt-1 text-right">
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">
              Esqueci minha senha
            </Link>
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="primary w-full" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <AuthFooter mode="login" />
    </AuthShell>
  );
}
