import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Plus } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Lightbox } from "@/components/Lightbox";
import { Motion } from "@/components/Motion";
import { projects, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Lucrări realizate — Constria",
  description:
    "Fotografii cu foișoare, pergole și acoperișuri construite de echipa Constria, oriunde în România. Cere o ofertă: 0740 293 991.",
};

const wrap = "mx-auto w-full max-w-[1360px] px-[clamp(16px,4vw,48px)]";
const pill =
  "inline-flex h-12 items-center gap-2 rounded-full px-6 text-[0.85rem] font-extrabold uppercase tracking-[0.06em]";

export default function LucrariPage() {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        <section className="bg-plum-900 text-cream">
          <div className={`${wrap} pt-[clamp(56px,9vw,120px)] pb-[clamp(40px,6vw,72px)]`}>
            <nav aria-label="Unde te afli" className="text-sm font-semibold text-cream/70">
              <Link href="/" className="hover:text-cream">Prima pagină</Link>
              <span aria-hidden="true"> / </span>
              <span className="text-cream">Lucrări</span>
            </nav>
            <h1 className="display mt-6 text-[clamp(3.2rem,10vw,9rem)]">
              Lucrările <span className="text-red">noastre</span>
            </h1>
            <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-cream/85">
              Acoperișuri schimbate, foișoare și pergole construite de echipa Constria. Apasă pe o fotografie ca s-o
              vezi mare.
            </p>
          </div>
        </section>

        {projects.map((p, i) => (
          <section
            key={p.id}
            id={p.id}
            className={`py-[clamp(48px,7vw,96px)] ${i > 0 ? "border-t border-plum-900/15" : ""}`}
          >
            <div className={wrap}>
              <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <h2 className="reveal display max-w-[18ch] text-[clamp(2.2rem,5vw,4.2rem)] leading-[1.3]">{p.title}</h2>
                <p className="reveal max-w-[52ch] text-lg leading-relaxed text-muted">{p.text}</p>
              </div>
              <Lightbox photos={p.photos} />
            </div>
          </section>
        ))}

        <section className="bg-cream py-[clamp(56px,8vw,112px)]">
          <div className={`${wrap} flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between`}>
            <h2 className="display text-[clamp(2.6rem,6vw,5.5rem)]">
              Vrei una la fel?
              <br />
              <span className="text-red-strong">Îți facem oferta.</span>
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/#oferta" className={`${pill} bg-red-strong text-white hover:bg-plum-900`}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Cere ofertă
              </Link>
              <a href={site.phoneHref} className="inline-flex h-12 items-center gap-2 px-2 font-extrabold hover:text-red-strong">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {site.phone}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <Motion />
    </>
  );
}
