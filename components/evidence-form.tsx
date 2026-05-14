"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FileUploadField } from "@/components/file-upload-field";

export function EvidenceForm({
  initialReportId = "",
  initialReportTarget = ""
}: {
  initialReportId?: string;
  initialReportTarget?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [resetToken, setResetToken] = useState(0);
  const canSubmit = Boolean(initialReportId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError("请先打开具体记录，再从记录详情页进入补充材料。");
      return;
    }

    const form = event.currentTarget;
    setSubmitting(true);
    setError("");
    setMessage("");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries()) as Record<string, unknown>;
    payload.evidence_urls = evidenceUrls;

    try {
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { error?: string; message?: string; reportId?: string };

      if (!response.ok) {
        throw new Error(data.error || "提交失败");
      }

      form.reset();
      setEvidenceUrls([]);
      setResetToken((current) => current + 1);
      setMessage((data.message || "补充材料已提交") + " 正在跳转到记录详情...");
      window.setTimeout(() => {
        router.push(data.reportId ? `/reports/${data.reportId}` : "/");
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <input type="hidden" name="report_id" value={initialReportId} />
      <input type="hidden" name="contact" value="" />

      <div className="card-muted px-4 py-4 text-sm leading-7 text-slate-600">
        补充证据同样需要先打码敏感信息。文件会保存到私有证据库，后台查看时使用限时授权链接。
      </div>

      <div className="card-muted px-4 py-4 text-sm leading-7 text-slate-600">
        {initialReportId ? (
          <>
            当前记录：<span className="font-medium text-ink">{initialReportTarget || "这条记录"}</span>。补充材料会附在这条记录下，方便后续继续查看时间线和图片。
          </>
        ) : (
          <>
            请先打开具体记录，再从详情页进入补充材料，这样不用自己填写记录 ID。
            <div className="mt-3">
              <Link href="/" className="text-sm font-medium text-accent-600">
                返回首页查找记录
              </Link>
            </div>
          </>
        )}
      </div>

      <FileUploadField
        label="补充证据截图"
        hint="仅支持图片文件。可以不传图，只补充时间线说明；也可以一次补多张图。"
        multiple
        resetToken={resetToken}
        onUploaded={setEvidenceUrls}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">补充说明</label>
        <textarea
          name="description"
          className="field min-h-32"
          placeholder="例如：补的是哪一段聊天、什么时候又联系过、这次想补充什么情况。"
          required
        />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <button type="submit" disabled={submitting || !canSubmit} className="button-primary w-full sm:w-auto disabled:opacity-60">
        {submitting ? "正在提交..." : "提交补充证据"}
      </button>
    </form>
  );
}
