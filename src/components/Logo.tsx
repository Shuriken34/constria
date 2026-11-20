// Sigla Constria: casa cu acoperiș roșu, pe fond vișiniu, ca în logo-ul existent.
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#4a002a" />
      <path d="M13 19 v12 h14 v-12 h-3.4 v7 h-2.2 v-3.6 h-2.8 v3.6 h-2.2 v-7 z" fill="#fff3e4" />
      <path d="M9 20 L20 11 L31 20" fill="none" stroke="#f00037" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="display text-[1.9rem] leading-none tracking-wide">
        Constr<span className="text-red">ia</span>
      </span>
    </span>
  );
}
