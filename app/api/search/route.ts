import { NextResponse } from "next/server";

import { searchPublicReports } from "@/lib/queries";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
    const limit = await enforceRateLimit({
      request,
      key: "search_query",
      limit: 45,
      windowMs: 60 * 1000,
      useDatabase: false
    });

    if (limit.limited) {
      return NextResponse.json({ error: "搜索过于频繁，请稍后再试。" }, { status: 429 });
    }

    const reports = await searchPublicReports(query);
    return NextResponse.json(
      { reports },
      {
        headers: {
          "Cache-Control": "public, max-age=15",
          "CDN-Cache-Control": "public, max-age=60",
          "Vercel-CDN-Cache-Control": "public, max-age=300"
        }
      }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
