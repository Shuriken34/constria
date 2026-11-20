import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { QuoteForm } from "./QuoteForm";

export function Quote() {
  return (
    <section id="oferta" className="py-[clamp(72px,10vw,140px)]">
      <div className="mx-auto grid w-full max-w-[1360px] gap-12 px-[clamp(16px,4vw,48px)] lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="reveal flex items-center gap-3 text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-muted">
            <span className="h-px w-10 bg-current" aria-hidden="true" />
            Ofertă
          </p>
          <h2 className="reveal display mt-4 text-[clamp(2.8rem,7vw,6.5rem)]">
            Spune-ne ce
            <br />
            construim
          </h2>
          <p className="reveal mt-6 max-w-[40ch] text-lg leading-relaxed text-muted">
            Completează formularul și te sunăm să stabilim vizita pentru măsurători.
          </p>
          <ul className="reveal mt-10 space-y-4">
            <li>
              <a href={site.phoneHref} className="group inline-flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-plum-900 text-cream group-hover:bg-red-strong">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="display text-[2.4rem] leading-none group-hover:text-red-strong">{site.phone}</span>
              </a>
            </li>
            <li>
              <a href={site.whatsappHref} className="inline-flex items-center gap-4 font-bold hover:text-red-strong">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-plum-900/20">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                Scrie-ne pe WhatsApp
              </a>
            </li>
            <li className="flex items-center gap-4 font-semibold text-muted">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-plum-900/20">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              {site.hours}
            </li>
            <li className="flex items-center gap-4 font-semibold text-muted">
              <span className="grid h-14 w-14 place-items-center rounded-full border border-plum-900/20">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              {site.area}
            </li>
          </ul>
        </div>
        <div className="reveal rounded-[28px] bg-cream p-[clamp(20px,4vw,44px)] shadow-[0_10px_40px_rgba(46,0,26,0.12)]">
          <QuoteForm />
        </div>
      </div>
    </section>
  );
}
