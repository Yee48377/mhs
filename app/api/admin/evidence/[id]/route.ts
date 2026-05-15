import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getErrorMessage } from "@/lib/api-errors";
import { isAdminAuthenticated } from "@/lib/auth";
import { hasServerEnv } from "@/lib/env";
import { recordAdminAction } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasServerEnv()) {
    return NextResponse.json(
      { error: "服务端尚未完成 Supabase 环境变量配置。" },
      { status: 503 }
    );
  }

  try {
    const payload = (await request.json()) as { action?: string };
    const action = payload.action;
    const supabase = createAdminSupabaseClient();

    const { data: submission, error: submissionError } = await supabase
      .from("report_evidence_submissions")
      .select("*")
      .eq("id", params.id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: "找不到补充记录。" }, { status: 404 });
    }

    if (action === "delete") {
      const { error } = await supabase.from("report_evidence_submissions").delete().eq("id", params.id);

      if (error) {
        throw error;
      }

      revalidatePath("/");
      revalidatePath(`/reports/${submission.report_id}`);
      await recordAdminAction({
        request,
        action: "delete_submission",
        targetType: "evidence_submission",
        targetId: params.id,
        reportId: submission.report_id,
        details: {
          previous: submission
        }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "hide") {
      const { data, error } = await supabase
        .from("report_evidence_submissions")
        .update({ review_status: "已拒绝" })
        .eq("id", params.id);

      if (error) {
        throw error;
      }

      revalidatePath(`/reports/${submission.report_id}`);
      await recordAdminAction({
        request,
        action: "hide_submission",
        targetType: "evidence_submission",
        targetId: params.id,
        reportId: submission.report_id,
        details: {
          previous: submission.review_status,
          next: "已拒绝"
        }
      });
      return NextResponse.json({ success: true, submission: data });
    }

    if (action === "approve") {
      const { data, error: updateSubmissionError } = await supabase
        .from("report_evidence_submissions")
        .update({ review_status: "已通过" })
        .eq("id", params.id);

      if (updateSubmissionError) {
        throw updateSubmissionError;
      }

      revalidatePath("/");
      revalidatePath(`/reports/${submission.report_id}`);
      await recordAdminAction({
        request,
        action: "approve_submission",
        targetType: "evidence_submission",
        targetId: params.id,
        reportId: submission.report_id,
        details: {
          previous: submission.review_status,
          next: "已通过"
        }
      });
      return NextResponse.json({ success: true, submission: data });
    }

    return NextResponse.json({ error: "未知操作。" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: getErrorMessage(error, "更新失败") },
      { status: 400 }
    );
  }
}
