"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-8">
        <h1 className="text-2xl font-bold">Recuperar senha</h1>
        <p className="mt-1 text-sm text-gray-400">MVP: fluxo de envio de e-mail será conectado no backend.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
          <button type="submit" className="primary w-full">
            Enviar link
          </button>
        </form>
        {sent && <p className="mt-3 text-sm text-accent">Se o e-mail existir, enviaremos instruções.</p>}
        <Link href="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
          Voltar ao login
        </Link>
      </div>
    </main>
  );
}
