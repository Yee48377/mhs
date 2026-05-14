import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/api-errors";
import { ADMIN_COOKIE } from "@/lib/constants";
import { getServerEnv, hasServerEnv } from "@/lib/env";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (!hasServerEnv()) {
    return NextResponse.json(
      { error: "服务端尚未完成管理员环境变量配置。" },
      { status: 503 }
    );
  }

  try {
    const payload = await request.json();
    const parsed = adminLoginSchema.parse(payload);

    if (parsed.password !== getServerEnv().adminPassword) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    cookies().set(ADMIN_COOKIE, "authenticated", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: getErrorMessage(error, "登录失败") },
      { status: 400 }
    );
  }
}
