import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { DEFAULT_STATUS } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api-errors";
import { hasServerEnv } from "@/lib/env";
import { containsBannedTerms } from "@/lib/moderation";
import { detectSubmissionFlags, recordSubmissionEvent } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getRecordIndexKey, serializeStoredEvidenceUrls } from "@/lib/utils";
import { reportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      { error: "服务端尚未完成 Supabase 环境变量配置。" },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const parsed = reportSchema.parse(payload);
    const bannedTerm = containsBannedTerms(parsed.description, parsed.target_id, parsed.platform);
    const flags = await detectSubmissionFlags({
      eventType: "report_submit",
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      targetId: parsed.target_id,
      evidenceCount: parsed.evidence_urls.length
    });

    if (bannedTerm) {
      await recordSubmissionEvent({
        request,
        eventType: "report_submit",
        status: "blocked",
        targetId: parsed.target_id,
        platform: parsed.platform,
        flags: [...flags, "blocked_banned_terms"],
        errorMessage: `检测到不合适用语：${bannedTerm}`
      });

      return NextResponse.json(
        { error: `检测到不合适用语：${bannedTerm}。请改用时间线和事实描述。` },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const indexKey = getRecordIndexKey(parsed.target_id);

    const { data: existing } = await supabase
      .from("commission_reports")
      .select("id, report_count")
      .eq("target_id", parsed.target_id)
      .eq("platform", parsed.platform)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("commission_reports")
        .update({
          days_missing: parsed.days_missing,
          last_contact: parsed.last_contact,
          report_count: existing.report_count + 1,
          status: DEFAULT_STATUS,
          is_public: true,
          is_resolved: false
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const { error: supplementError } = await supabase.from("report_evidence_submissions").insert({
        report_id: existing.id,
        contact: parsed.submitter_contact || null,
        description: `重复投稿补充：${parsed.description}`,
        evidence_url: serializeStoredEvidenceUrls(parsed.evidence_urls),
        review_status: "已通过"
      });

      if (supplementError) {
        throw supplementError;
      }

      revalidatePath("/");
      revalidatePath(`/records/${indexKey}`);
      revalidatePath(`/reports/${existing.id}`);
      await recordSubmissionEvent({
        request,
        eventType: "report_submit",
        status: "merged",
        recordId: existing.id,
        targetId: parsed.target_id,
        platform: parsed.platform,
        flags
      });

      return NextResponse.json({
        message: "已作为补充内容并入现有记录。",
        report: data
      });
    }

    const { data, error } = await supabase
      .from("commission_reports")
      .insert({
        target_id: parsed.target_id,
        platform: parsed.platform,
        days_missing: parsed.days_missing,
        last_contact: parsed.last_contact,
        description: parsed.description,
        evidence_url: serializeStoredEvidenceUrls(parsed.evidence_urls),
        submitter_contact: parsed.submitter_contact || null,
        status: DEFAULT_STATUS,
        is_public: true,
        is_resolved: false,
        report_count: 1
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath(`/records/${indexKey}`);
    revalidatePath(`/reports/${data.id}`);
    await recordSubmissionEvent({
      request,
      eventType: "report_submit",
      status: "published",
      recordId: data.id,
      targetId: parsed.target_id,
      platform: parsed.platform,
      flags
    });

    return NextResponse.json({
      message: "记录已提交并公开。",
      report: data
    });
  } catch (error) {
    console.error(error);
    await recordSubmissionEvent({
      request,
      eventType: "report_submit",
      status: "error",
      errorMessage: getErrorMessage(error, "提交失败")
    });
    return NextResponse.json(
      { error: getErrorMessage(error, "提交失败") },
      { status: 400 }
    );
  }
}
