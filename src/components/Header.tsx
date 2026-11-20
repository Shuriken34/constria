import Link from "next/link";
import { Phone, Plus } from "lucide-react";
import { site } from "@/lib/site";
import { Logo } from "./Logo";

const nav = [
  { href: "/#servicii", label: "Servicii" },
  { href: "/#lucrari", label: "Lucrări" },
  { href: "/#cum-lucram", label: "Cum lucrăm" },
  { href: "/#oferta", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-plum-900/10 bg-beige/90 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[76px] max-w-[1360px] items-center justify-between gap-4 px-[clamp(16px,4vw,48px)]">
        <Link href="/" aria-label="Constria, prima pagină">
          <Logo />
        </Link>
        <nav aria-label="Navigare principală" className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-[0.85rem] font-extrabold uppercase tracking-[0.08em] hover:text-red-strong"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={site.phoneHref}
            aria-label={`Sună la ${site.phone}`}
            className="grid h-11 w-11 place-items-center rounded-full border border-plum-900/20 hover:bg-plum-900 hover:text-cream lg:hidden"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
          <a
            href={site.phoneHref}
            className="hidden items-center gap-2 px-3 text-[0.95rem] font-extrabold lg:inline-flex hover:text-red-strong"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            {site.phone}
          </a>
          <Link
            href="/#oferta"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-red-strong px-4 text-[0.85rem] font-extrabold whitespace-nowrap uppercase tracking-[0.06em] text-white transition-colors hover:bg-plum-900 sm:px-5"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">Ofertă</span>
            <span className="hidden sm:inline">Cere ofertă</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
