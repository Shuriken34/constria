// Client Supabase per cerere (Express + @supabase/ssr)
// Sesiunea utilizatorului stă în cookie-uri; fiecare interogare rulează ca acel utilizator,
// iar regulile RLS din baza de date decid ce poate citi și modifica.
const { createServerClient, parseCookieHeader, serializeCookieHeader } = require('@supabase/ssr');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BUCKET = 'listing-images';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Lipsesc NEXT_PUBLIC_SUPABASE_URL sau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY în .env');
  process.exit(1);
}

function createSupabase(req, res) {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(req.headers.cookie ?? '').filter((c) => c.value !== undefined);
      },
      setAll(cookiesToSet, headers) {
        if (res.headersSent) return;
        for (const { name, value, options } of cookiesToSet) {
          res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, options));
        }
        // Antete anti-cache: răspunsurile cu sesiune nu trebuie salvate de CDN-uri
        for (const [k, v] of Object.entries(headers || {})) res.setHeader(k, v);
      },
    },
  });
}

// Aruncă eroarea Supabase ca să ajungă în handler-ul global de erori
function must({ data, error }) {
  if (error) throw Object.assign(new Error(error.message), { supabase: error });
  return data;
}

module.exports = { createSupabase, must, BUCKET, SUPABASE_URL };
