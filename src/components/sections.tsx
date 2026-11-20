import Image from "next/image";
import { ArrowUpRight, Phone, Plus } from "lucide-react";
import { mainServices, media, otherServices, site, steps } from "@/lib/site";
import { HeroVideo } from "./HeroVideo";

const gutter = "px-[clamp(16px,4vw,48px)]";
const wrap = `mx-auto w-full max-w-[1360px] ${gutter}`;
const pill =
  "inline-flex h-12 items-center gap-2 rounded-full px-6 text-[0.85rem] font-extrabold uppercase tracking-[0.06em]";

function RoofTick({ className = "h-[0.45em] w-[0.8em]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 14" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M2 12 L12 3 L22 12" fill="none" stroke="#f00037" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Eyebrow({ children, className = "text-muted" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`reveal flex items-center gap-3 text-[0.8rem] font-extrabold uppercase tracking-[0.16em] ${className}`}>
      <span className="h-px w-10 bg-current" aria-hidden="true" />
      {children}
    </p>
  );
}

/* ---------- Hero ---------- */

export function Hero() {
  return (
    <section data-hero className="relative isolate flex min-h-[calc(100dvh-76px)] items-end overflow-hidden text-cream">
      <HeroVideo src={media.heroVideo} poster={media.heroPoster} />
      <div className={`${wrap} pt-28 pb-[clamp(28px,5vw,56px)]`}>
        <p className="hero-fade flex items-center gap-3 text-[0.8rem] font-extrabold uppercase tracking-[0.16em]">
          <span className="h-px w-10 bg-cream" aria-hidden="true" />
          Schimbare acoperiș · Foișoare · Garduri
        </p>
        <h1 className="display mt-4 text-[clamp(3.4rem,12.5vw,14rem)] [text-shadow:0_4px_40px_rgba(46,0,26,0.35)]">
          <span data-hero-line="1" className="-my-[0.12em] block overflow-hidden py-[0.12em]">
            <span className="hero-rise block whitespace-nowrap">Schimbăm</span>
          </span>
          <span data-hero-line="-1" className="-my-[0.12em] block overflow-hidden py-[0.12em] text-right">
            <span className="hero-rise block whitespace-nowrap text-red">acoperișul</span>
          </span>
        </h1>
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="hero-fade max-w-[52ch] text-lg leading-relaxed">
            <strong className="font-extrabold">Acoperișul vechi îl înlocuim cu unul nou, de la șarpantă la jgheaburi.</strong>{" "}
            Construim foișoare din lemn și montăm garduri de orice tip.
          </p>
          <div className="hero-fade flex flex-wrap gap-2.5">
            {mainServices.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`${pill} bg-cream px-5 text-plum-900 transition-transform hover:-translate-y-0.5`}
              >
                {s.short}
              </a>
            ))}
            <a
              href="#oferta"
              data-service="schimbare-acoperis"
              className={`${pill} bg-red-strong text-white transition-transform hover:-translate-y-0.5`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Cere ofertă
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bandă cu servicii ---------- */

export function Marquee() {
  const items = ["Schimbare acoperiș", "Foișoare", "Garduri", "Porți", "Schimbare acoperiș", "Foișoare", "Garduri", "Acoperișuri noi", "Vopsire tablă", "Terase"];
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center gap-[0.6em] pr-[0.6em]">
      {items.map((t, i) => (
        <span key={`${t}-${i}`} className="flex items-center gap-[0.6em]">
          {t}
          <RoofTick />
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee overflow-hidden bg-plum-900 py-5 text-cream">
      <div className="marquee-track display flex w-max text-[clamp(2rem,4vw,3.4rem)]" aria-hidden="true">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/* ---------- Servicii ---------- */

export function Services() {
  return (
    <section id="servicii" className="py-[clamp(72px,10vw,140px)]">
      <div className={wrap}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>Ce facem</Eyebrow>
            <h2 className="reveal display mt-4 text-[clamp(2.8rem,7vw,6.5rem)]">
              Acoperișuri, foișoare
              <br />
              și garduri
            </h2>
          </div>
          <p className="reveal max-w-[40ch] text-lg leading-relaxed text-muted">
            Acestea sunt lucrările pe care le facem cel mai des. Le facem cap-coadă, cu echipa noastră.
          </p>
        </div>

        {/* Lucrările principale, în ordinea importanței */}
        <div className="mt-14 space-y-[clamp(56px,8vw,112px)]">
          {mainServices.map((s, i) => (
            <article
              key={s.id}
              id={s.id}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <div
                className={`reveal relative overflow-hidden rounded-[28px] ${i === 0 ? "min-h-[360px] lg:min-h-[600px]" : "min-h-[320px] lg:min-h-[520px]"} ${i % 2 === 1 ? "lg:order-2" : ""}`}
              >
                <div data-parallax className="absolute inset-x-0 -top-[10%] -bottom-[10%]">
                  <Image src={s.image} alt={s.alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
                </div>
                {i === 0 && (
                  <span className="absolute top-5 left-5 rounded-full bg-red-strong px-4 py-2 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-white">
                    Specialitatea noastră
                  </span>
                )}
              </div>
              <div className="reveal">
                <h3 className={`display ${i === 0 ? "text-[clamp(3rem,6.5vw,6rem)]" : "text-[clamp(2.6rem,5vw,4.8rem)]"}`}>
                  {s.title}
                </h3>
                <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">{s.summary}</p>
                <ul className="mt-6 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-center gap-3 font-semibold">
                      <RoofTick className="h-3 w-5" />
                      {d}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#oferta"
                    data-service={s.id}
                    className={`${pill} bg-red-strong text-white transition-colors hover:bg-plum-900`}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Cere ofertă
                    <span className="sr-only">pentru {s.title.toLowerCase()}</span>
                  </a>
                  <a href={site.phoneHref} className="inline-flex h-12 items-center gap-2 px-2 font-extrabold hover:text-red-strong">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {site.phone}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Alte servicii */}
        <div className="mt-[clamp(72px,10vw,140px)] border-t border-plum-900/15 pt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="reveal display text-[clamp(2.2rem,4vw,3.4rem)]">Alte servicii</h3>
            <p className="reveal max-w-[44ch] text-muted">Le facem și pe acestea, la cerere.</p>
          </div>
          <ul className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {otherServices.map((s) => (
              <li key={s.id} id={s.id} className="reveal min-h-[280px]">
                <a
                  href="#oferta"
                  data-service={s.id}
                  className="group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[18px] p-6 text-cream"
                >
                  <div className="absolute inset-0 -z-20">
                    <Image
                      src={s.image}
                      alt={s.alt}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(46,0,26,0.05)_20%,rgba(46,0,26,0.9)_100%)]" />
                  <span className="absolute top-5 right-5 grid h-11 w-11 place-items-center rounded-full bg-cream text-plum-900 transition-colors group-hover:bg-red-strong group-hover:text-white">
                    <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="display text-[2.2rem]">{s.title}</span>
                  <span className="mt-1.5 max-w-[40ch] font-medium text-cream/90">{s.summary}</span>
                  <span className="sr-only">Cere ofertă pentru {s.title.toLowerCase()}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Manifest ---------- */

export function Manifest() {
  const text =
    "Un acoperiș bun nu se vede. Se simte la prima ploaie, la prima zăpadă și în fiecare an în care nu te mai gândești la el.";
  const accent = new Set(["ploaie,", "zăpadă"]);
  return (
    <section className="bg-cream py-[clamp(80px,12vw,180px)]">
      <div className={wrap}>
        <p
          className="fill-text max-w-[22ch] text-[clamp(2rem,5.2vw,4.6rem)] leading-[1.08] font-extrabold tracking-[-0.02em]"
          aria-label={text}
        >
          {text.split(" ").map((w, i) => (
            <span key={i} aria-hidden="true">
              <span className={`w${accent.has(w) ? " accent" : ""}`}>{w}</span>{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ---------- Bandă foto ---------- */

export function Band({
  image,
  line1,
  line2,
  service,
  cta,
}: {
  image: string;
  line1: string;
  line2: string;
  service: string;
  cta: string;
}) {
  return (
    <section className="relative isolate flex min-h-[clamp(520px,85vh,820px)] items-end overflow-hidden text-cream">
      <div data-parallax className="absolute inset-x-0 -top-[10%] -bottom-[10%] -z-20">
        <Image src={image} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(74,0,42,0.2)_0%,rgba(46,0,26,0.92)_85%)]" />
      <div className={`${wrap} py-[clamp(48px,8vw,96px)]`}>
        <h2 className="reveal display text-[clamp(3rem,9vw,8.5rem)]">
          {line1}
          <br />
          <span className="text-red">{line2}</span>
        </h2>
        <div className="reveal mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#oferta"
            data-service={service}
            className={`${pill} bg-red-strong text-white hover:bg-cream hover:text-plum-900`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {cta}
          </a>
          <a href={site.phoneHref} className="inline-flex h-12 items-center gap-2 px-2 font-extrabold hover:text-red">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {site.phone}
          </a>
        </div>
      </div>
    </section>
  );
}

export function RoofBand() {
  return (
    <Band
      image={media.roofBand}
      line1="Un acoperiș nou."
      line2="Ierni liniștite."
      service="schimbare-acoperis"
      cta="Cere ofertă pentru acoperiș"
    />
  );
}

export function GazeboBand() {
  return (
    <Band
      image={media.gazeboBand}
      line1="Un foișor în curte."
      line2="Veri lungi afară."
      service="foisoare"
      cta="Cere ofertă pentru foișor"
    />
  );
}

/* ---------- Cum lucrăm ---------- */

export function Process() {
  return (
    <section id="cum-lucram" className="bg-plum-900 py-[clamp(72px,10vw,140px)] text-cream">
      <div className={wrap} data-process>
        <Eyebrow className="text-beige-300">Cum lucrăm</Eyebrow>
        <h2 className="reveal display mt-4 text-[clamp(2.8rem,7vw,6.5rem)]">Patru pași, fără surprize</h2>

        <div className="relative mt-14">
          <div className="absolute top-0 right-0 left-0 hidden h-[3px] bg-cream/15 lg:block" aria-hidden="true">
            <div data-progress-line className="h-full origin-left bg-red" />
          </div>
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map((step, i) => (
              <li key={step.title} className="reveal border-t-[3px] border-cream/15 pt-6 lg:border-t-0 lg:pt-9">
                <span className="display block text-[5.5rem] leading-none text-red" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-2xl font-extrabold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-cream/75">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
