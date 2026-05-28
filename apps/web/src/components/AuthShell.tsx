import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-card p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <BrandLogo />
          </div>
          <h1 className="mt-2 text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}

export function AuthFooter({ mode }: { mode: "login" | "register" }) {
  return (
    <p className="mt-6 text-center text-sm text-gray-400">
      {mode === "login" ? (
        <>
          Não tem conta?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Criar conta
          </Link>
        </>
      ) : (
        <>
          Já tem conta?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Entrar
          </Link>
        </>
      )}
    </p>
  );
}
