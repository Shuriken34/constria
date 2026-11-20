import Image from "next/image";
import { ArrowUpRight, Phone, Plus } from "lucide-react";
import { media, services, site, steps } from "@/lib/site";
import { HeroVideo } from "./HeroVideo";

const gutter = "px-[clamp(16px,4vw,48px)]";
const wrap = `mx-auto w-full max-w-[1360px] ${gutter}`;

/* ---------- Hero ---------- */

export function Hero() {
  return (
    <section data-hero className="relative isolate flex min-h-[calc(100dvh-76px)] items-end overflow-hidden text-cream">
      <HeroVideo src={media.heroVideo} poster={media.heroPoster} />
      <div className={`${wrap} pt-28 pb-[clamp(28px,5vw,56px)]`}>
        <p className="hero-fade flex items-center gap-3 text-[0.8rem] font-extrabold uppercase tracking-[0.16em]">
          <span className="h-px w-10 bg-cream" aria-hidden="true" />
          Acoperișuri · Garduri · Foișoare · Terase
        </p>
        <h1 className="display mt-4 text-[clamp(3.6rem,13.5vw,15rem)] [text-shadow:0_4px_40px_rgba(46,0,26,0.35)]">
          <span data-hero-line="1" className="block overflow-hidden pb-[0.04em]">
            <span className="hero-rise block whitespace-nowrap">Acoperișuri</span>
          </span>
          <span data-hero-line="-1" className="block overflow-hidden pb-[0.04em] text-right">
            <span className="hero-rise block whitespace-nowrap">
              ca la <span className="text-red">carte</span>
            </span>
          </span>
        </h1>
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <p className="hero-fade max-w-[52ch] text-lg leading-relaxed">
            <strong className="font-extrabold">Construim, schimbăm și vopsim acoperișuri.</strong> Montăm garduri de orice
            tip și ridicăm foișoare și terase. Vii cu ideea, noi venim cu măsurătorile și oferta.
          </p>
          <div className="hero-fade flex flex-wrap gap-2.5">
            {services.filter((s) => ["acoperis-nou", "garduri", "foisoare", "terase"].includes(s.id)).map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex h-12 items-center rounded-full bg-cream px-5 text-[0.85rem] font-extrabold uppercase tracking-[0.06em] text-plum-900 transition-transform hover:-translate-y-0.5"
              >
                {s.short}
              </a>
            ))}
            <a
              href="#oferta"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-red-strong px-6 text-[0.85rem] font-extrabold uppercase tracking-[0.06em] text-white transition-transform hover:-translate-y-0.5"
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

function RoofTick() {
  return (
    <svg viewBox="0 0 24 14" className="h-[0.45em] w-[0.8em] shrink-0" aria-hidden="true">
      <path d="M2 12 L12 3 L22 12" fill="none" stroke="#f00037" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Marquee() {
  const items = ["Acoperișuri noi", "Schimbare acoperiș", "Vopsire tablă", "Garduri", "Porți", "Foișoare", "Terase", "Pergole"];
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center gap-[0.6em] pr-[0.6em]">
      {items.map((t) => (
        <span key={t} className="flex items-center gap-[0.6em]">
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

const tileLayout = [
  "lg:col-span-4 lg:row-span-2 min-h-[420px] lg:min-h-[640px]",
  "lg:col-span-2 min-h-[300px]",
  "lg:col-span-2 min-h-[300px]",
  "lg:col-span-2 min-h-[340px]",
  "lg:col-span-2 min-h-[340px]",
  "lg:col-span-2 min-h-[340px]",
];

export function Services() {
  return (
    <section id="servicii" className="py-[clamp(72px,10vw,140px)]">
      <div className={wrap}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="reveal flex items-center gap-3 text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-muted">
              <span className="h-px w-10 bg-current" aria-hidden="true" />
              Ce facem
            </p>
            <h2 className="reveal display mt-4 text-[clamp(2.8rem,7vw,6.5rem)]">
              De la șarpantă
              <br />
              la ultimul stâlp de gard
            </h2>
          </div>
          <p className="reveal max-w-[42ch] text-lg leading-relaxed text-muted">
            Șase lucrări pe care le facem cap-coadă, cu echipa noastră. Alege una și îți facem oferta.
          </p>
        </div>

        <ul className="mt-12 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-6">
          {services.map((s, i) => (
            <li key={s.id} id={s.id} className={`reveal ${tileLayout[i]} sm:[&:first-child]:col-span-2 lg:[&:first-child]:col-span-4`}>
              <a
                href="#oferta"
                data-service={s.id}
                className="group relative isolate flex h-full flex-col justify-end overflow-hidden rounded-[18px] p-6 text-cream"
              >
                <div data-parallax className="absolute inset-x-0 -top-[10%] -bottom-[10%] -z-20">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes={i === 0 ? "(min-width:1024px) 66vw, 100vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"}
                    className="object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.06]"
                  />
                </div>
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(46,0,26,0)_25%,rgba(46,0,26,0.88)_100%)]" />
                <span className="absolute top-5 right-5 grid h-12 w-12 place-items-center rounded-full bg-cream text-plum-900 transition-colors group-hover:bg-red-strong group-hover:text-white">
                  <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className={`display ${i === 0 ? "text-[clamp(2.6rem,5vw,4.5rem)]" : "text-[clamp(2rem,3vw,2.6rem)]"}`}>
                  {s.title}
                </h3>
                <p className="mt-2 max-w-[44ch] font-medium text-cream/90">{s.summary}</p>
                {i === 0 && (
                  <ul className="mt-5 hidden flex-wrap gap-2 sm:flex">
                    {s.details.map((d) => (
                      <li key={d} className="rounded-full border border-cream/35 px-3.5 py-1.5 text-sm font-semibold backdrop-blur-sm">
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="sr-only">Cere ofertă pentru {s.title.toLowerCase()}</span>
              </a>
            </li>
          ))}
        </ul>
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

export function Band() {
  return (
    <section className="relative isolate flex min-h-[clamp(520px,85vh,820px)] items-end overflow-hidden text-cream">
      <div data-parallax className="absolute inset-x-0 -top-[10%] -bottom-[10%] -z-20">
        <Image src={media.band} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(74,0,42,0.2)_0%,rgba(46,0,26,0.92)_85%)]" />
      <div className={`${wrap} py-[clamp(48px,8vw,96px)]`}>
        <h2 className="reveal display text-[clamp(3rem,9vw,8.5rem)]">
          Un acoperiș nou.
          <br />
          <span className="text-red">Ierni liniștite.</span>
        </h2>
        <div className="reveal mt-8 flex flex-wrap items-center gap-4">
          <a
            href="#oferta"
            data-service="acoperis-nou"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-red-strong px-6 text-[0.85rem] font-extrabold uppercase tracking-[0.06em] text-white hover:bg-cream hover:text-plum-900"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Cere ofertă pentru acoperiș
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

/* ---------- Cum lucrăm ---------- */

export function Process() {
  return (
    <section id="cum-lucram" className="bg-plum-900 py-[clamp(72px,10vw,140px)] text-cream">
      <div className={wrap} data-process>
        <p className="reveal flex items-center gap-3 text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-beige-300">
          <span className="h-px w-10 bg-current" aria-hidden="true" />
          Cum lucrăm
        </p>
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
