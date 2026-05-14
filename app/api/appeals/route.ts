import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/api-errors";
import { hasServerEnv } from "@/lib/env";
import { containsBannedTerms } from "@/lib/moderation";
import { detectSubmissionFlags, recordSubmissionEvent } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { serializeStoredEvidenceUrls } from "@/lib/utils";
import { appealSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      { error: "服务端尚未完成 Supabase 环境变量配置。" },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const parsed = appealSchema.parse(payload);
    const flags = await detectSubmissionFlags({
      eventType: "appeal_submit",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      targetId: parsed.report_id,
      evidenceCount: parsed.evidence_urls.length
    });
    const bannedTerm = containsBannedTerms(parsed.statement);

    if (bannedTerm) {
      await recordSubmissionEvent({
        request,
        eventType: "appeal_submit",
        status: "blocked",
        targetId: parsed.report_id,
        flags: [...flags, "blocked_banned_terms"],
        errorMessage: `检测到不合适用语：${bannedTerm}`
      });
      return NextResponse.json(
        { error: `检测到不合适用语：${bannedTerm}。请改用时间线和事实描述。` },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    const { data: report } = await supabase
      .from("commission_reports")
      .select("id")
      .eq("id", parsed.report_id)
      .maybeSingle();

    if (!report) {
      await recordSubmissionEvent({
        request,
        eventType: "appeal_submit",
        status: "missing_record",
        targetId: parsed.report_id,
        flags,
        errorMessage: "找不到对应记录 ID"
      });
      return NextResponse.json({ error: "找不到对应记录 ID" }, { status: 404 });
    }

    const { error } = await supabase.from("report_evidence_submissions").insert({
      report_id: parsed.report_id,
      contact: parsed.contact || null,
      description: `[说明 / 更正] ${parsed.statement}`,
      evidence_url: serializeStoredEvidenceUrls(parsed.evidence_urls),
      review_status: "待处理"
    });

    if (error) {
      throw error;
    }

    await recordSubmissionEvent({
      request,
      eventType: "appeal_submit",
      status: "submitted",
      recordId: parsed.report_id,
      targetId: parsed.report_id,
      flags
    });

    return NextResponse.json({
      message: "说明 / 更正已提交，管理员会查看并决定是否隐藏、撤下或调整这条记录。",
      reportId: parsed.report_id
    });
  } catch (error) {
    console.error(error);
    await recordSubmissionEvent({
      request,
      eventType: "appeal_submit",
      status: "error",
      errorMessage: getErrorMessage(error, "提交失败")
    });
    return NextResponse.json(
      { error: getErrorMessage(error, "提交失败") },
      { status: 400 }
    );
  }
}
