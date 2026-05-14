import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { parseStoredEvidenceUrls } from "@/lib/utils";

export async function GET(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json({ error: "服务端尚未完成 Supabase 环境变量配置。" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("reportId");

  if (!reportId) {
    return NextResponse.json({ error: "缺少记录 ID。" }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "evidence";

    const { data: report, error: reportError } = await supabase
      .from("commission_reports")
      .select("id, evidence_url, is_public, status")
      .eq("id", reportId)
      .single();

    if (reportError || !report || !report.is_public || !["已公开", "已解决"].includes(report.status)) {
      return NextResponse.json({ error: "找不到公开记录。" }, { status: 404 });
    }

    const { data: supplements, error: supplementError } = await supabase
      .from("report_evidence_submissions")
      .select("id, description, evidence_url, created_at")
      .eq("report_id", reportId)
      .eq("review_status", "已通过")
      .order("created_at", { ascending: true });

    if (supplementError) {
      throw supplementError;
    }

    const items = [
      ...parseStoredEvidenceUrls(report.evidence_url).map((path, index) => ({
        id: `report-${report.id}-${index}`,
        label: `主证据 ${index + 1}`,
        description: "投稿时提交的主证据截图",
        path
      })),
      ...(supplements || []).flatMap((submission, index) =>
        parseStoredEvidenceUrls(submission.evidence_url).map((path, imageIndex) => ({
          id: `${submission.id}-${imageIndex}`,
          label: `补充证据 ${index + 1}-${imageIndex + 1}`,
          description: submission.description,
          path
        }))
      )
    ];

    const signedItems = await Promise.all(
      items.map(async (item) => {
        if (item.path.startsWith("http://") || item.path.startsWith("https://")) {
          return { ...item, signedUrl: item.path };
        }

        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(item.path, 60 * 10);

        if (error || !data?.signedUrl) {
          return null;
        }

        return {
          id: item.id,
          label: item.label,
          description: item.description,
          signedUrl: data.signedUrl
        };
      })
    );

    return NextResponse.json({
      items: signedItems.filter(Boolean)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "证据加载失败。" }, { status: 500 });
  }
}
