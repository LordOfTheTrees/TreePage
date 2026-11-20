// TreePage public beacon. Deploy with verify_jwt = false (supabase/config.toml).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the Edge Runtime.
// TELEMETRY_SALT is optional; when it is unset the salt is read from
// public.telemetry_config (key = treepage_salt) and cached on this instance.
// The stored row never includes the client IP or the user agent.

import { handleTelemetry } from "../_shared/telemetry.mjs";

let cachedSalt: string | null = null;

function supabaseSettings(): { url: string; key: string } | null {
  const url = (Deno.env.get("SUPABASE_URL") || "").trim().replace(/\/$/, "");
  const key = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "").trim();
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
    {
      headers: {
        apikey: settings.key,
        Authorization: `Bearer ${settings.key}`,
      },
    },
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
    headers: {
      apikey: settings.key,
      Authorization: `Bearer ${settings.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
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
