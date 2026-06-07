import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { NextRequest, NextResponse } from "next/server";
import { validateBackendToken } from "@/lib/validate-token";
import { isValidReferer } from "@/lib/allowed-referers";
import { createClient } from "@supabase/supabase-js";
import { FIELD_MAP } from "@/lib/token";

const supabase = createClient(
  process.env.NEXT_PUBLIC_HOLLY_SUPABASE_URL_HOLLY!,
  process.env.HOLLY_SUPABASE_SERVICE_ROLE_KEY_HOLLY!,
);

const HOLLY_WORKERS = [
  "zxcprime367",
  "zxcprime368",
  "jinluxus303",
  "zxcprime359",
  "zxcprime360",
  "zxcprime361",
  "zxcprime362",
  "jerometecson21799",
  "jerometecsonn",
  "amenohabakiri174",
];

function randomWorker(): string {
  return HOLLY_WORKERS[Math.floor(Math.random() * HOLLY_WORKERS.length)];
}

async function dbGet(
  tmdbId: string,
  mediaType: string,
  season: string | null,
  episode: string | null,
) {
  try {
    const { data, error } = await supabase.rpc("get_holly", {
      p_tmdb_id: Number(tmdbId),
      p_media_type: mediaType,
      p_season: season ? Number(season) : null,
      p_episode: episode ? Number(episode) : null,
    });
    if (error || !data) return null;
    return data as Array<{ quality: string; embed_url: string }>;
  } catch {
    return null;
  }
}

async function dbSave(
  tmdbId: string,
  mediaType: string,
  season: string | null,
  episode: string | null,
  qualities: Array<{ quality: string; embed_url: string }>,
) {
  try {
    const { error } = await supabase.rpc("save_holly", {
      p_tmdb_id: Number(tmdbId),
      p_media_type: mediaType,
      p_season: season ? Number(season) : null,
      p_episode: episode ? Number(episode) : null,
      p_qualities: qualities,
    });
    if (error) console.warn("[holly dbSave] error:", error);
  } catch (err: any) {
    console.warn("[holly dbSave] exception:", err.message);
  }
}

export async function GET(req: NextRequest) {
  try {
    const tmdbId = req.nextUrl.searchParams.get(FIELD_MAP.id); // "mid"
    const mediaType = req.nextUrl.searchParams.get("b"); // rotate this too if you want
    const season = req.nextUrl.searchParams.get(FIELD_MAP.season); // "sx"
    const episode = req.nextUrl.searchParams.get(FIELD_MAP.episode); // "ex"
    const title = req.nextUrl.searchParams.get(FIELD_MAP.title); // "q"
    const year = req.nextUrl.searchParams.get(FIELD_MAP.year); // "p"
    const ts = Number(req.nextUrl.searchParams.get(FIELD_MAP.ts)); // "rt"
    const token = req.nextUrl.searchParams.get(FIELD_MAP.token)!; // "sig"
    const f_token = req.nextUrl.searchParams.get(FIELD_MAP.fToken)!; // "xt"

    if (!tmdbId || !mediaType || !title || !year || !ts || !token) {
      return NextResponse.json(
        { success: false, error: "need token" },
        { status: 404 },
      );
    }

    if (Date.now() - Number(ts) > 8000) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    if (!validateBackendToken(tmdbId, f_token, ts, token)) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    const referer = req.headers.get("referer") || "";
    if (!isValidReferer(referer)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    // ─── STEP 1: Check cache, else fetch Holly metadata ───────────────────────
    let qualities: Array<{ quality: string; embed_url: string }>;

    const cached = await dbGet(tmdbId, mediaType, season, episode);

    if (cached) {
      qualities = cached;
    } else {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const hollySlug =
        mediaType === "tv" && season && episode
          ? `${baseSlug}-season-${season}-episode-${episode}`
          : `${baseSlug}-${year}`;

      const step1Url = `https://holly-1.${randomWorker()}.workers.dev/?slug=${encodeURIComponent(hollySlug)}`;

      const step1Res = await fetchWithTimeout(step1Url, {}, 6000);
      if (!step1Res.ok) {
        return NextResponse.json(
          {
            success: false,
            error: "Holly step 1 failed",
            status: step1Res.status,
          },
          { status: step1Res.status },
        );
      }

      const step1Data = await step1Res.json();
      qualities = step1Data.qualities ?? [];

      if (!qualities.length) {
        return NextResponse.json(
          { success: false, error: "No qualities found from Holly" },
          { status: 404 },
        );
      }

      // fire-and-forget
      dbSave(tmdbId, mediaType, season, episode, qualities).catch((e: any) =>
        console.warn("[holly dbSave] failed:", e.message),
      );
    }

    // ─── STEP 2: Pick best quality → resolve embed ────────────────────────────
    const bestQuality =
      qualities.find((q) => q.quality === "1080p") ??
      qualities.find((q) => q.quality === "default") ??
      qualities[0];

    const embedUrl = bestQuality.embed_url;

    const step2Url = `https://holly-2.${randomWorker()}.workers.dev/?embed_url=${encodeURIComponent(embedUrl)}`;

    const step2Res = await fetchWithTimeout(step2Url, {}, 6000);
    if (!step2Res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Holly step 2 failed",
          status: step2Res.status,
        },
        { status: step2Res.status },
      );
    }

    const step2Data = await step2Res.json();
    const sources: Array<{ label: string; type: string; file: string }> =
      step2Data.sources ?? [];

    if (!sources.length) {
      return NextResponse.json(
        { success: false, error: "No sources from Holly step 2" },
        { status: 404 },
      );
    }

    const hlsSource =
      sources.find((s) => s.type === "mp4") ??
      sources.find((s) => s.type === "hls" && s.label === "LS-25") ??
      sources.find((s) => s.type === "hls");

    if (!hlsSource) {
      return NextResponse.json(
        { success: false, error: "No usable source found" },
        { status: 404 },
      );
    }

    // ─── STEP 3: Proxy the stream URL ─────────────────────────────────────────
    const proxiedUrl = `https://holly-3.${randomWorker()}.workers.dev/?url=${encodeURIComponent(hlsSource.file)}`;

    const proxyCheck = await fetchWithTimeout(
      proxiedUrl,
      { method: "GET", headers: { Range: "bytes=0-1" } },
      5000,
    ).catch(() => null);

    if (!proxyCheck?.ok) {
      return NextResponse.json(
        { success: false, error: "Holly proxy check failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      c: !!cached,
      links: [
        {
          type: hlsSource.type === "hls" ? "hls" : "mp4",
          link: proxiedUrl,
        },
      ],
      subtitles: [],
    });
  } catch (err) {
    console.error("Holly route error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
