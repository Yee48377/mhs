import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { hasServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { parseStoredEvidenceUrls } from "@/lib/utils";

function isLegacyExternalUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function getFirstEvidenceUrl(value: string) {
  const urls = parseStoredEvidenceUrls(value);
  return urls[0] || null;
}

export async function GET(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      { error: "服务端尚未完成 Supabase 环境变量配置。" },
      { status: 503 }
    );
  }

  const { searchParams, origin } = new URL(request.url);
  const reportId = searchParams.get("reportId");
  const submissionId = searchParams.get("submissionId");
  const admin = await isAdminAuthenticated();
  const supabase = createAdminSupabaseClient();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "evidence";

  try {
    if (submissionId) {
      if (!admin) {
        return NextResponse.json({ error: "未授权访问证据。" }, { status: 401 });
      }

      const { data, error } = await supabase
        .from("report_evidence_submissions")
        .select("evidence_url")
        .eq("id", submissionId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "找不到补充证据。" }, { status: 404 });
      }

      const firstEvidenceUrl = getFirstEvidenceUrl(data.evidence_url);

      if (!firstEvidenceUrl) {
        return NextResponse.json({ error: "这条补充材料里没有可查看的图片。" }, { status: 404 });
      }

      if (isLegacyExternalUrl(firstEvidenceUrl)) {
        return NextResponse.redirect(firstEvidenceUrl);
      }

      const { data: signed, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(firstEvidenceUrl, 60);

      if (signError || !signed?.signedUrl) {
        throw signError || new Error("无法生成证据访问链接。");
      }

      return NextResponse.redirect(signed.signedUrl);
    }

    if (reportId) {
      const { data, error } = await supabase
        .from("commission_reports")
        .select("evidence_url, is_public, status")
        .eq("id", reportId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "找不到记录。" }, { status: 404 });
      }

      const canRead = admin || (data.is_public && ["已公开", "已解决"].includes(data.status));

      if (!canRead) {
        return NextResponse.json({ error: "该证据暂未开放查看。" }, { status: 403 });
      }

      const firstEvidenceUrl = getFirstEvidenceUrl(data.evidence_url);

      if (!firstEvidenceUrl) {
        return NextResponse.json({ error: "这条记录里没有可查看的图片。" }, { status: 404 });
      }

      if (isLegacyExternalUrl(firstEvidenceUrl)) {
        return NextResponse.redirect(firstEvidenceUrl);
      }

      const { data: signed, error: signError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(firstEvidenceUrl, 60);

      if (signError || !signed?.signedUrl) {
        throw signError || new Error("无法生成证据访问链接。");
      }

      return NextResponse.redirect(signed.signedUrl);
    }

    return NextResponse.json({ error: "缺少证据标识。" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/?evidence=unavailable", origin));
  }
}
