"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { AuthFooter, AuthShell } from "@/components/AuthShell";
import { AuthPageSkeleton } from "@/components/skeleton";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await api.register(
        email,
        password,
        displayName.trim() || undefined,
      );
      setToken(access_token);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <AuthPageSkeleton />;
  }

  return (
    <AuthShell title="Criar conta" subtitle="Comece sua avaliação fitness">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-gray-400">Nome</label>
          <input
            type="text"
            minLength={2}
            maxLength={120}
            placeholder="Como quer ser chamado"
            data-testid="register-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">E-mail</label>
          <input
            type="email"
            required
            data-testid="register-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-400">Senha (mín. 8 caracteres)</label>
          <input
            type="password"
            required
            minLength={8}
            data-testid="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="primary w-full" disabled={loading} data-testid="register-submit">
          {loading ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <AuthFooter mode="register" />
    </AuthShell>
  );
}
