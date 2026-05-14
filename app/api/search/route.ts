import { NextResponse } from "next/server";

import { searchPublicReports } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  try {
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
