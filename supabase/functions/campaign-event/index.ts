
import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const allowedEvents = new Set([
  "impression",
  "click",
  "video_start",
  "video_complete",
  "cta_click",
  "save",
  "share",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function publishableKeys() {
  const keys: string[] = [];
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      for (const value of Object.values(parsed)) {
        if (typeof value === "string" && value) keys.push(value);
      }
    } catch {}
  }
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) keys.push(legacy);
  return keys;
}

function authorized(req: Request) {
  const key = req.headers.get("apikey") ?? "";
  return key.length > 0 && publishableKeys().includes(key);
}

function secretKey() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const value = parsed.default ?? Object.values(parsed)[0];
      if (typeof value === "string" && value) return value;
    } catch {}
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!legacy) throw new Error("Server secret unavailable");
  return legacy;
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json();
    const campaignId = cleanText(body?.campaign_id, 64);
    const eventName = cleanText(body?.event_name, 32);
    const clientEventId = cleanText(body?.event_id, 128);
    const anonymousId = cleanText(body?.anonymous_id, 128);
    const sessionId = cleanText(body?.session_id, 128);
    const metadata =
      body?.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    if (!campaignId || !eventName || !allowedEvents.has(eventName)) {
      return json({ error: "Invalid campaign event" }, 400);
    }

    if (JSON.stringify(metadata).length > 4096) {
      return json({ error: "Metadata too large" }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: campaign, error: campaignError } = await admin
      .from("admin_campaigns")
      .select("id")
      .eq("id", campaignId)
      .maybeSingle();

    if (campaignError) throw campaignError;
    if (!campaign) return json({ error: "Campaign not found" }, 404);

    const row = {
      campaign_id: campaignId,
      event_name: eventName,
      client_event_id: clientEventId,
      anonymous_id: anonymousId,
      session_id: sessionId,
      metadata,
    };

    if (clientEventId) {
      const { error } = await admin
        .from("admin_campaign_events")
        .upsert(row, {
          onConflict: "campaign_id,client_event_id",
          ignoreDuplicates: true,
        });
      if (error) throw error;
    } else {
      const { error } = await admin.from("admin_campaign_events").insert(row);
      if (error) throw error;
    }

    return json({ ok: true });
  } catch {
    return json({ error: "Unable to record campaign event" }, 500);
  }
});
