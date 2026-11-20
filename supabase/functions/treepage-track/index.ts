// TreePage public beacon. Deploy with verify_jwt = false (supabase/config.toml).
// SUPABASE_URL is injected by the Edge Runtime. The database key is the
// optional function secret SUPABASE_SECRET_KEY when set, otherwise the
// runtime-injected SUPABASE_SERVICE_ROLE_KEY. Every REST call sends apikey.
// Authorization: Bearer is added only when the key starts with eyJ, because
// new sb_secret_ keys are not JWTs.
// TELEMETRY_SALT is optional; when it is unset the salt is read from
// public.telemetry_config (key = treepage_salt) and cached on this instance.
// The stored row never includes the client IP or the user agent.

import { handleTelemetry, resolveSupabaseKey, supabaseRestHeaders } from "../_shared/telemetry.mjs";

let cachedSalt: string | null = null;

function supabaseSettings(): { url: string; key: string } | null {
  const url = (Deno.env.get("SUPABASE_URL") || "").trim().replace(/\/$/, "");
  const key = resolveSupabaseKey({
    SUPABASE_SECRET_KEY: Deno.env.get("SUPABASE_SECRET_KEY") || "",
    SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  });
  if (!url || !key) return null;
  return { url, key };
}

async function getSalt(): Promise<string | null> {
  if (cachedSalt) return cachedSalt;

  const fromEnv = (Deno.env.get("TELEMETRY_SALT") || "").trim();
  if (fromEnv) {
    cachedSalt = fromEnv;
    return cachedSalt;
  }

  const settings = supabaseSettings();
  if (!settings) return null;

  const response = await fetch(
    `${settings.url}/rest/v1/telemetry_config?key=eq.treepage_salt&select=value`,
    { headers: supabaseRestHeaders(settings.key) },
  );
  if (!response.ok) return null;

  const rows = await response.json();
  const value = Array.isArray(rows) ? rows[0]?.value : null;
  if (typeof value !== "string" || value.length < 16) return null;
  cachedSalt = value;
  return cachedSalt;
}

async function insertRow(row: Record<string, unknown>): Promise<void> {
  const settings = supabaseSettings();
  if (!settings) return;

  const response = await fetch(`${settings.url}/rest/v1/treepage_events`, {
    method: "POST",
    headers: supabaseRestHeaders(settings.key, {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    }),
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    console.error("telemetry insert rejected", response.status);
  }
}

Deno.serve((request: Request) =>
  handleTelemetry(request, {
    getSalt,
    insert: insertRow,
  })
);
