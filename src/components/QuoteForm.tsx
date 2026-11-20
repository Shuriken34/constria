"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { submitQuote, type QuoteState } from "@/lib/quote";
import { services, site } from "@/lib/site";

const initial: QuoteState = { status: "idle" };

const field =
  "mt-2 w-full rounded-[14px] border-2 border-plum-900/15 bg-white px-4 py-3.5 text-base font-medium text-plum-900 placeholder:text-muted/60 transition-colors focus:border-red-strong focus:outline-none aria-[invalid=true]:border-red-strong";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-bold text-red-strong">
      {msg}
    </p>
  );
}

export function QuoteForm() {
  const [state, action, pending] = useActionState(submitQuote, initial);
  const serviceRef = useRef<HTMLSelectElement>(null);
  const e = state.errors ?? {};

  // Un clic pe o plăcuță de serviciu (data-service) alege lucrarea în formular
  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const el = (ev.target as HTMLElement).closest<HTMLElement>("[data-service]");
      if (el && serviceRef.current) serviceRef.current.value = el.dataset.service ?? "";
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (state.status === "success") {
    return (
      <div role="status" className="py-6">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-red-strong text-white">
          <Check className="h-8 w-8" aria-hidden="true" />
        </span>
        <p className="display mt-6 text-5xl">Am primit cererea</p>
        <p className="mt-3 max-w-[44ch] text-lg leading-relaxed text-muted">
          {state.message} Dacă e urgent, sună la{" "}
          <a href={site.phoneHref} className="font-extrabold text-plum-900 underline">{site.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="name" className="font-bold">Nume</label>
        <input id="name" name="name" autoComplete="name" required className={field}
          aria-invalid={!!e.name} aria-describedby={e.name ? "name-err" : undefined} />
        <FieldError id="name-err" msg={e.name} />
      </div>
      <div>
        <label htmlFor="phone" className="font-bold">Telefon</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className={field}
          placeholder="07xx xxx xxx" aria-invalid={!!e.phone} aria-describedby={e.phone ? "phone-err" : undefined} />
        <FieldError id="phone-err" msg={e.phone} />
      </div>
      <div>
        <label htmlFor="locality" className="font-bold">Localitate</label>
        <input id="locality" name="locality" autoComplete="address-level2" required className={field}
          aria-invalid={!!e.locality} aria-describedby={e.locality ? "locality-err" : undefined} />
        <FieldError id="locality-err" msg={e.locality} />
      </div>
      <div>
        <label htmlFor="service" className="font-bold">Ce lucrare ai nevoie?</label>
        <select id="service" name="service" required defaultValue="" ref={serviceRef} className={field}
          aria-invalid={!!e.service} aria-describedby={e.service ? "service-err" : undefined}>
          <option value="" disabled>Alege lucrarea</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
          <option value="altceva">Altceva</option>
        </select>
        <FieldError id="service-err" msg={e.service} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="font-bold">
          Detalii <span className="font-medium text-muted">(opțional)</span>
        </label>
        <textarea id="message" name="message" rows={4} maxLength={2000} className={field}
          placeholder="De exemplu: casă de 120 m², tablă veche ruginită, vrem vopsire sau înlocuire." />
      </div>

      {/* Câmp-capcană pentru roboți */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="sm:col-span-2">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 shrink-0 accent-red-strong"
            aria-invalid={!!e.consent} aria-describedby={e.consent ? "consent-err" : undefined} />
          <span className="text-muted">
            Sunt de acord ca Constria să mă contacteze la numărul de mai sus pentru această ofertă.
          </span>
        </label>
        <FieldError id="consent-err" msg={e.consent} />
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={pending}
          className="inline-flex h-14 items-center gap-2.5 rounded-full bg-red-strong px-8 text-[0.9rem] font-extrabold uppercase tracking-[0.06em] text-white transition-colors hover:bg-plum-900 disabled:opacity-60">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
          {pending ? "Se trimite…" : "Trimite cererea"}
        </button>
        {state.status === "error" && state.message && (
          <p role="alert" className="font-bold text-red-strong">{state.message}</p>
        )}
      </div>
    </form>
  );
}
