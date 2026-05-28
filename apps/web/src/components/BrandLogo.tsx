interface BrandLogoProps {
  compact?: boolean;
  showWordmark?: boolean;
  className?: string;
}

export function BrandLogo({ compact = false, showWordmark = true, className = "" }: BrandLogoProps) {
  const sizeClass = compact ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        className={sizeClass}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Logo Personal AI"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brand-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <linearGradient id="brand-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#brand-bg)" />
        <rect x="24" y="30" width="16" height="4" rx="2" fill="url(#brand-metal)" />
        <rect x="18" y="27" width="5" height="10" rx="1.5" fill="#CBD5E1" />
        <rect x="13" y="25" width="4" height="14" rx="1.5" fill="#F1F5F9" />
        <rect x="41" y="27" width="5" height="10" rx="1.5" fill="#CBD5E1" />
        <rect x="47" y="25" width="4" height="14" rx="1.5" fill="#F1F5F9" />
      </svg>
      {showWordmark && (
        <div className="leading-tight">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Personal AI</p>
          <p className="text-[11px] text-slate-400">Seu treinador inteligente</p>
        </div>
      )}
    </div>
  );
}
