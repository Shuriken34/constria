import Link from "next/link";
import { Phone, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-[1360px] px-[clamp(16px,4vw,48px)] py-24">
          <p className="display text-[clamp(6rem,22vw,16rem)] leading-[0.8] text-red">404</p>
          <h1 className="display mt-6 text-[clamp(2.4rem,6vw,5rem)]">Pagina nu mai există</h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-muted">
            Constria nu mai este un marketplace de materiale. Acum schimbăm acoperișuri, construim foișoare
            și montăm garduri.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#oferta"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-red-strong px-6 text-[0.85rem] font-extrabold uppercase tracking-[0.06em] text-white hover:bg-plum-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Cere ofertă
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center rounded-full border-2 border-plum-900/20 px-6 text-[0.85rem] font-extrabold uppercase tracking-[0.06em] hover:border-plum-900"
            >
              Mergi la prima pagină
            </Link>
            <a href={site.phoneHref} className="inline-flex h-12 items-center gap-2 px-2 font-extrabold hover:text-red-strong">
              <Phone className="h-4 w-4" aria-hidden="true" />
              {site.phone}
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
