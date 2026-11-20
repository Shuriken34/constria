import { services, site } from "@/lib/site";
import { LogoMark } from "./Logo";

export function Footer() {
  // Anul se calculează la build (site static)
  const year = new Date().getFullYear();
  return (
    <footer className="overflow-hidden bg-plum-950 text-cream/75">
      <div className="mx-auto grid w-full max-w-[1360px] gap-10 px-[clamp(16px,4vw,48px)] pt-16 pb-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <LogoMark className="h-12 w-12" />
          <p className="mt-5 max-w-[34ch] leading-relaxed">
            Acoperișuri noi, schimbare și vopsire de acoperișuri, garduri de orice tip, foișoare și terase.
          </p>
        </div>
        <div>
          <h2 className="text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-cream">Servicii</h2>
          <ul className="mt-4 space-y-2">
            {services.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="hover:text-cream">{s.title}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[0.8rem] font-extrabold uppercase tracking-[0.16em] text-cream">Contact</h2>
          <ul className="mt-4 space-y-2">
            <li><a href={site.phoneHref} className="hover:text-cream">{site.phone}</a></li>
            <li><a href={site.whatsappHref} className="hover:text-cream">WhatsApp</a></li>
            <li><a href={`mailto:${site.email}`} className="hover:text-cream">{site.email}</a></li>
            <li>{site.hours}</li>
          </ul>
        </div>
      </div>
      <p
        className="display select-none px-[clamp(16px,4vw,48px)] text-center text-[clamp(5rem,24vw,22rem)] leading-[0.78] text-cream/[0.07]"
        aria-hidden="true"
      >
        Constria
      </p>
      <div className="border-t border-cream/10">
        <p className="mx-auto w-full max-w-[1360px] px-[clamp(16px,4vw,48px)] py-5 text-sm">
          © {year} Constria. Toate drepturile rezervate.
        </p>
      </div>
    </footer>
  );
}
