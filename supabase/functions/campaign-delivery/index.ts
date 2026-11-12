
import { createClient } from "npm:@supabase/supabase-js@2.119.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

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

function inWindow(startAt: string | null, endAt: string | null, now: number) {
  if (startAt && new Date(startAt).getTime() > now) return false;
  if (endAt && new Date(endAt).getTime() <= now) return false;
  return true;
}

function statusEligible(status: string, startAt: string | null, now: number) {
  if (status === "active") return true;
  if (status === "scheduled") return !!startAt && new Date(startAt).getTime() <= now;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!authorized(req)) return json({ error: "Unauthorized" }, 401);

  try {
    const url = new URL(req.url);
    const requestedPlacement = url.searchParams.get("placement");
    const category = (url.searchParams.get("category") ?? "").trim().toLowerCase();
    const rawLimit = Number(url.searchParams.get("limit") ?? 20);
    const limit = Math.min(50, Math.max(1, Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 20));
    const now = Date.now();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, secretKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: campaigns, error } = await admin
      .from("admin_campaigns")
      .select("*")
      .in("status", ["active", "scheduled"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    const eligible = (campaigns ?? []).filter((campaign) => {
      if (!statusEligible(campaign.status, campaign.start_at, now)) return false;
      if (!inWindow(campaign.start_at, campaign.end_at, now)) return false;

      if (campaign.placement === "specific_category") {
        if (!category || !campaign.target_category) return false;
        if (campaign.target_category.trim().toLowerCase() !== category) return false;

        if (requestedPlacement === "articles_feed" && campaign.content_type !== "article") return false;
        if (requestedPlacement === "videos_feed" && campaign.content_type !== "video") return false;
        return true;
      }

      if (requestedPlacement && campaign.placement !== requestedPlacement) return false;
      return true;
    });

    const articleIds = eligible
      .filter((c) => c.content_type === "article" && c.article_id)
      .map((c) => c.article_id);

    const videoIds = eligible
      .filter((c) => c.content_type === "video" && c.video_id)
      .map((c) => c.video_id);

    const [articlesResult, videosResult] = await Promise.all([
      articleIds.length
        ? admin
            .from("admin_custom_articles")
            .select("id,headline,summary,image_url,category,brand,cta_text,cta_url,sponsored,status,start_at,end_at,priority")
            .in("id", articleIds)
        : Promise.resolve({ data: [], error: null }),
      videoIds.length
        ? admin
            .from("admin_custom_videos")
            .select("id,title,description,thumbnail_url,video_url,category,brand,cta_text,cta_url,sponsored,status,start_at,end_at,priority")
            .in("id", videoIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (articlesResult.error) throw articlesResult.error;
    if (videosResult.error) throw videosResult.error;

    const articles = new Map((articlesResult.data ?? []).map((row) => [row.id, row]));
    const videos = new Map((videosResult.data ?? []).map((row) => [row.id, row]));

    const response = eligible
      .map((campaign) => {
        if (campaign.creative_mode === "direct") {
          if (
            campaign.content_type !== "article" ||
            !campaign.image_url
          ) {
            return null;
          }

          return {
            id: campaign.id,
            name: campaign.name,
            creative_mode: "direct",
            content_type: "article",
            placement: campaign.placement,
            target_category: campaign.target_category,
            frequency_every: campaign.frequency_every,
            priority: campaign.priority,
            start_at: campaign.start_at,
            end_at: campaign.end_at,
            content: {
              id: campaign.id,
              campaign_id: campaign.id,
              is_campaign: true,
              headline: campaign.headline ?? campaign.name ?? "",
              summary: campaign.description ?? "",
              image_url: campaign.image_url,
              category: campaign.target_category,
              brand: campaign.brand,
              cta_text: campaign.cta_text,
              cta_url: campaign.cta_url,
              sponsored: campaign.sponsored ?? true,
              status: campaign.status,
              start_at: campaign.start_at,
              end_at: campaign.end_at,
              priority: campaign.priority,
            },
          };
        }

        const content =
          campaign.content_type === "article"
            ? articles.get(campaign.article_id)
            : videos.get(campaign.video_id);

        if (!content) return null;
        if (!statusEligible(content.status, content.start_at, now)) return null;
        if (!inWindow(content.start_at, content.end_at, now)) return null;

        return {
          id: campaign.id,
          name: campaign.name,
          creative_mode: "linked_content",
          content_type: campaign.content_type,
          placement: campaign.placement,
          target_category: campaign.target_category,
          frequency_every: campaign.frequency_every,
          priority: campaign.priority,
          start_at: campaign.start_at,
          end_at: campaign.end_at,
          content,
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    return json({
      generated_at: new Date().toISOString(),
      count: response.length,
      campaigns: response,
    });
  } catch {
    return json({ error: "Unable to load campaigns" }, 500);
  }
});
