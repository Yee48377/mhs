import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getErrorMessage } from "@/lib/api-errors";
import { isAdminAuthenticated } from "@/lib/auth";
import { hasServerEnv } from "@/lib/env";
import { recordAdminAction } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { adminUpdateSchema } from "@/lib/validators";
import type { Database } from "@/types/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const payload = await request.json();
    const parsed = adminUpdateSchema.parse(payload);
    const supabase = createAdminSupabaseClient();

    if (parsed.action === "delete") {
      const { error } = await supabase.from("commission_reports").delete().eq("id", params.id);

      if (error) {
        throw error;
      }

      revalidatePath("/");
      revalidatePath(`/reports/${params.id}`);
      await recordAdminAction({
        request,
        action: "delete_report",
        targetType: "commission_report",
        targetId: params.id,
        reportId: params.id
      });

      return NextResponse.json({ success: true });
    }

    const patch: Database["public"]["Tables"]["commission_reports"]["Update"] = {};

    if (parsed.action === "publish") {
      patch.is_public = true;
      patch.status = "已公开";
    }

    if (parsed.action === "hide") {
      patch.is_public = false;
      patch.status = "已隐藏";
    }

    if (parsed.action === "reject") {
      patch.is_public = false;
      patch.status = "已隐藏";
    }

    if (parsed.action === "resolve") {
      patch.is_public = true;
      patch.is_resolved = true;
      patch.status = "已解决";
    }

    const { data, error } = await supabase
      .from("commission_reports")
      .update(patch)
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    revalidatePath("/");
    revalidatePath(`/reports/${params.id}`);
    await recordAdminAction({
      request,
      action: parsed.action,
      targetType: "commission_report",
      targetId: params.id,
      reportId: params.id,
      details: patch
    });

    return NextResponse.json({ report: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: getErrorMessage(error, "更新失败") },
      { status: 400 }
    );
  }
}
