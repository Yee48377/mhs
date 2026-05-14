import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env";
import { enforceRateLimit } from "@/lib/rate-limit";
import { recordSubmissionEvent } from "@/lib/observability";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { slugifyFileName } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedImageType = (typeof ALLOWED_TYPES)[number];

function detectImageMime(buffer: Buffer): AllowedImageType | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function POST(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      { error: "服务端尚未完成 Supabase 环境变量配置。" },
      { status: 503 }
    );
  }

  try {
    const limit = await enforceRateLimit({
      request,
      key: "upload_submit",
      limit: 12,
      windowMs: 10 * 60 * 1000
    });

    if (limit.limited) {
      await recordSubmissionEvent({
        request,
        eventType: "upload_submit",
        status: "rate_limited",
        errorMessage: "上传过于频繁"
      });
      return NextResponse.json({ error: "上传过于频繁，请稍后再试。" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "未检测到上传文件。" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.some((type) => type === file.type)) {
      return NextResponse.json({ error: "仅支持 png、jpg、webp 图片。" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "图片大小需控制在 5MB 以内。" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const detectedType = detectImageMime(buffer);

    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      await recordSubmissionEvent({
        request,
        eventType: "upload_submit",
        status: "blocked",
        errorMessage: "文件内容不是受支持的图片格式"
      });
      return NextResponse.json({ error: "文件内容校验失败，请上传真实的 png、jpg 或 webp 图片。" }, { status: 400 });
    }

    if (detectedType !== file.type) {
      await recordSubmissionEvent({
        request,
        eventType: "upload_submit",
        status: "blocked",
        errorMessage: `声明类型 ${file.type} 与文件头 ${detectedType} 不匹配`
      });
      return NextResponse.json({ error: "文件类型与实际内容不一致，请重新导出图片后再上传。" }, { status: 400 });
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "evidence";
    const path = `evidence/${crypto.randomUUID()}-${slugifyFileName(file.name)}`;
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      cacheControl: "3600",
      contentType: detectedType,
      upsert: false
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      path,
      originalName: file.name
    });
  } catch (error) {
    console.error(error);
    await recordSubmissionEvent({
      request,
      eventType: "upload_submit",
      status: "error",
      errorMessage: error instanceof Error ? error.message : "上传失败"
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 400 }
    );
  }
}
