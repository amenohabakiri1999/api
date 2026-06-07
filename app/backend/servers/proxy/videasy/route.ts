import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, *",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin, pathname } = new URL(request.url);

    // TS segment request
    const tsUrl = searchParams.get("ts");
    if (tsUrl) {
      const headers = JSON.parse(searchParams.get("headers") || "{}");
      const tsRes = await fetch(tsUrl, { headers });
      const tsData = await tsRes.arrayBuffer();
      return new NextResponse(tsData, {
        status: tsRes.status,
        headers: {
          ...Object.fromEntries(tsRes.headers.entries()),
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // M3U8 proxy request
    const target = searchParams.get("m3u8-proxy");
    if (!target) {
      return new NextResponse("Missing 'm3u8-proxy' parameter", {
        status: 400,
      });
    }

    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
        Referer: "https://player.videasy.to/",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.7",
      },
    });

    const text = await res.text();

    const rewritten = text.replace(/^([^\#\r\n][^\r\n]*)$/gm, (match) => {
      const absoluteURL = new URL(match.trim(), target).href;
      const hdrs = encodeURIComponent(
        JSON.stringify({
          origin: "https://player.videasy.to",
          referer: "https://player.videasy.to/",
        }),
      );
      const encodedURL = encodeURIComponent(absoluteURL);
      return `${origin}${pathname}?ts=${encodedURL}&headers=${hdrs}`;
    });

    return new NextResponse(rewritten, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new NextResponse("Proxy error: " + (err as Error).message, {
      status: 500,
    });
  }
}
