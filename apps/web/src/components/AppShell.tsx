"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BottomNav, type AppTab } from "@/components/BottomNav";
import { BrandLogo } from "@/components/BrandLogo";

interface AppShellProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: React.ReactNode;
  activeTab?: AppTab;
  rightSlot?: React.ReactNode;
}

export function AppShell({
  title,
  subtitle,
  backHref,
  children,
  activeTab,
  rightSlot,
}: AppShellProps) {
  const backLabel = backHref === "/dashboard" ? "Voltar para o início" : "Voltar";

  return (
    <main className="app-container">
      <motion.header
        className="mb-5 flex items-start justify-between gap-3"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div>
          <div className="mb-2">
            <BrandLogo compact showWordmark={false} />
          </div>
          {backHref && (
            <Link
              href={backHref}
              className="back-link mb-2"
            >
              ← {backLabel}
            </Link>
          )}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 subtle">{subtitle}</p>}
        </div>
        {rightSlot}
      </motion.header>
      {children}
      <BottomNav activeTab={activeTab} />
    </main>
  );
}
