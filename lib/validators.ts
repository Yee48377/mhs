import { z } from "zod";
import dayjs from "dayjs";

import { DEFAULT_STATUS, STATUS_OPTIONS } from "@/lib/constants";

const safeText = z
  .string()
  .trim()
  .min(2, "请至少填写 2 个字符")
  .max(2000, "内容过长");

export const reportSchema = z.object({
  target_id: z.string().trim().min(1, "请填写对方 ID / UID / 用户名").max(80),
  platform: z.string().trim().min(1, "请选择平台").max(40),
  days_missing: z.coerce.number().int().min(10, "当前规则要求失联天数至少 10 天").max(3650),
  last_contact: z
    .string()
    .min(1, "请选择最后联系日期")
    .refine(
      (value) => {
        const selected = dayjs(value);
        return selected.isValid() && selected.isBefore(dayjs().subtract(9, "day"), "day");
      },
      "最后联系日期必须距离今天至少满 10 天"
    ),
  description: safeText.max(1200, "情况说明请控制在 1200 字内"),
  submitter_contact: z.string().trim().max(120).optional().or(z.literal("")),
  evidence_urls: z.array(z.string().trim().min(1).max(500)).min(1, "请先上传至少 1 张证据图片").max(12, "最多上传 12 张图片"),
  status: z.enum(STATUS_OPTIONS).default(DEFAULT_STATUS)
});

export const appealSchema = z.object({
  report_id: z.string().uuid("请从具体记录页面进入说明 / 更正"),
  contact: z.string().trim().max(120).optional().or(z.literal("")),
  statement: safeText.max(1200, "说明请控制在 1200 字内"),
  evidence_urls: z.array(z.string().trim().min(1).max(500)).max(12, "最多上传 12 张图片").optional().default([])
});

export const evidenceSupplementSchema = z.object({
  report_id: z.string().uuid("请从具体记录页面进入补充材料"),
  contact: z.string().trim().max(120).optional().or(z.literal("")),
  description: safeText.max(1000, "补充说明请控制在 1000 字内"),
  evidence_urls: z.array(z.string().trim().min(1).max(500)).max(12, "最多上传 12 张图片").optional().default([])
});

export const adminLoginSchema = z.object({
  password: z.string().min(1, "请输入管理员密码")
});

export const adminUpdateSchema = z.object({
  action: z.enum(["publish", "hide", "resolve", "reject", "delete"]),
  status: z.string().optional()
});
