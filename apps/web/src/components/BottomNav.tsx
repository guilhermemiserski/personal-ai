"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export type AppTab = "home" | "progress" | "coach" | "profile";

const TABS: { id: AppTab; href: string; label: string; match: (path: string) => boolean }[] = [
  {
    id: "home",
    href: "/dashboard",
    label: "Início",
    match: (p) =>
      p.startsWith("/dashboard") || p.startsWith("/workout") || p.startsWith("/notifications"),
  },
  { id: "progress", href: "/progress", label: "Progresso", match: (p) => p.startsWith("/progress") },
  { id: "coach", href: "/coach", label: "Coach", match: (p) => p.startsWith("/coach") },
];

interface BottomNavProps {
  activeTab?: AppTab;
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed bottom-4 left-1/2 z-20 w-[min(92vw,680px)] -translate-x-1/2 rounded-2xl border border-surface-border bg-surface-card/95 p-2 backdrop-blur">
      <div className="relative flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive = activeTab ? tab.id === activeTab : tab.match(pathname);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative z-10 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                isActive ? "text-accent" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && mounted && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className="absolute inset-0 rounded-lg bg-accent/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
