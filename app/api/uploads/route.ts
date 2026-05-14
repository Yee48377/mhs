import { NextResponse } from "next/server";

import { hasServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { slugifyFileName } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      { error: "服务端尚未完成 Supabase 环境变量配置。" },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "未检测到上传文件。" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "仅支持 png、jpg、webp 图片。" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "图片大小需控制在 5MB 以内。" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "evidence";
    const path = `evidence/${crypto.randomUUID()}-${slugifyFileName(file.name)}`;
    const supabase = createAdminSupabaseClient();

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      cacheControl: "3600",
      contentType: file.type,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 400 }
    );
  }
}
