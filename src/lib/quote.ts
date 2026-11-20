import { createClient } from "@supabase/supabase-js";

// Formularul trimite cererea direct din browser la Supabase, cu cheia publică.
// Siguranța vine din regulile tabelului quote_requests: vizitatorii pot doar adăuga cereri,
// nu le pot citi, modifica sau șterge (vezi supabase/migrations).

export type QuoteState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<"name" | "phone" | "locality" | "service" | "consent", string>>;
};

const SERVICES = [
  "acoperis-nou",
  "schimbare-acoperis",
  "vopsire-acoperis",
  "garduri",
  "foisoare",
  "terase",
  "altceva",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

function text(formData: FormData, name: string) {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export async function submitQuote(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  // Câmp-capcană pentru roboți: oamenii nu îl văd și nu îl completează.
  if (text(formData, "website")) return { status: "success", message: "Cererea a fost trimisă." };

  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const locality = text(formData, "locality");
  const service = text(formData, "service");
  const message = text(formData, "message").slice(0, 2000);

  const errors: QuoteState["errors"] = {};
  if (name.length < 2) errors.name = "Scrie-ți numele.";
  if (phone.replace(/\D/g, "").length < 9) errors.phone = "Scrie un număr de telefon la care te putem suna.";
  if (locality.length < 2) errors.locality = "Scrie localitatea unde e lucrarea.";
  if (!SERVICES.includes(service)) errors.service = "Alege lucrarea de care ai nevoie.";
  if (formData.get("consent") !== "on") errors.consent = "Bifează acordul ca să te putem contacta.";

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "Verifică câmpurile marcate.", errors };
  }

  if (!supabase) {
    return {
      status: "error",
      message: "Formularul nu este încă conectat. Sună-ne direct și îți facem oferta la telefon.",
    };
  }

  const { error } = await supabase.from("quote_requests").insert({
    name: name.slice(0, 120),
    phone: phone.slice(0, 30),
    locality: locality.slice(0, 120),
    service,
    message: message || null,
  });

  if (error) {
    console.error("quote_requests insert failed", error.message);
    return {
      status: "error",
      message: "Cererea nu a putut fi trimisă. Încearcă din nou sau sună-ne direct.",
    };
  }

  return {
    status: "success",
    message: "Cererea a fost trimisă. Te sunăm în cel mult o zi lucrătoare.",
  };
}
