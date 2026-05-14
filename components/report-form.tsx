"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

import { FileUploadField } from "@/components/file-upload-field";
import { PLATFORMS } from "@/lib/constants";

export function ReportForm() {
  const router = useRouter();
  const latestAllowedDate = dayjs().subtract(10, "day").format("YYYY-MM-DD");
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [noticeChecks, setNoticeChecks] = useState<boolean[]>([false, false, false, false, false, false, false]);

  const allNoticeChecked = noticeChecks.every(Boolean);

  function toggleNoticeCheck(index: number, checked: boolean) {
    setNoticeChecks((current) => current.map((value, itemIndex) => (itemIndex === index ? checked : value)));
  }

  function acceptAllNoticeChecks() {
    setNoticeChecks([true, true, true, true, true, true, true]);
    setNoticeOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setError("");
    setMessage("");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries()) as Record<string, unknown>;

    if (evidenceUrls.length === 0) {
      setError("请先上传至少 1 张证据截图，未附带证据时禁止提交。");
      setSubmitting(false);
      return;
    }

    if (!allNoticeChecked) {
      setError("请先阅读并勾选完整的提交须知。");
      setSubmitting(false);
      return;
    }

    payload.evidence_urls = evidenceUrls;

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { error?: string; message?: string; report?: { id: string } };

      if (!response.ok) {
        throw new Error(data.error || "提交失败");
      }

      form.reset();
      setEvidenceUrls([]);
      setResetToken((current) => current + 1);
      const reportId = data.report?.id;
      setMessage((data.message || "已提交。") + (reportId ? " 正在跳转到记录详情..." : " 正在返回首页..."));
      window.setTimeout(() => {
        router.push(reportId ? `/reports/${reportId}` : "/");
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {noticeOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
          <div className="card-surface w-full max-w-2xl p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <h2 className="font-display text-2xl font-semibold">提交须知</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">请确认你已阅读并同意以下内容：</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                "我提交的信息基于本人真实经历",
                "我已对截图中的隐私信息进行打码",
                "我不会上传身份证、手机号、支付账号等敏感信息",
                "我理解平台仅提供记录与查询服务，不对内容真实性作保证",
                "我不会使用侮辱、诽谤、引战或人肉搜索性质的内容",
                "我理解公开内容可能会被其他用户查看",
                "如提交虚假内容，由提交者自行承担责任"
              ].map((item, index) => (
                <label key={item} className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-7 text-slate-700">
                  <input
                    type="checkbox"
                    checked={noticeChecks[index]}
                    onChange={(event) => toggleNoticeCheck(index, event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={acceptAllNoticeChecks} className="button-secondary">
                一键同意全部
              </button>
              <button type="button" onClick={() => setNoticeOpen(false)} disabled={!allNoticeChecked} className="button-primary">
                我已阅读并同意
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="card-muted flex gap-3 px-4 py-4 text-sm leading-7 text-slate-600">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p>请尽量按时间线整理信息，并附上可核实的记录或截图。请避免使用辱骂、攻击性语言。</p>
            <p>当前仅接收失联超过 10 天的投稿。公开内容会先进行审核，检查是否包含隐私或敏感信息后再展示。</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">对方 ID / UID / 用户名</label>
            <input name="target_id" className="field" placeholder="例如：米画师昵称 / 画加 ID / 临界用户名" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">平台</label>
            <select name="platform" className="field" required defaultValue="">
              <option value="" disabled>
                请选择平台
              </option>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">失联天数</label>
            <input name="days_missing" type="number" min="10" className="field" placeholder="例如：18" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">最后联系日期</label>
            <input
              name="last_contact"
              type="date"
              className="field"
              max={latestAllowedDate}
              required
            />
            <p className="mt-2 text-xs text-slate-500">最后联系日期需要早于或等于 {latestAllowedDate}。</p>
          </div>
        </div>

        <div className="card-muted space-y-3 px-4 py-4 text-sm leading-7 text-slate-600">
          <p className="font-medium text-slate-700">上传前请先打码以下信息：</p>
          <p>电话、微信、QQ、地址、银行信息、身份证、真实姓名、学校或其他可直接识别真实身份的信息。</p>
        </div>

        <FileUploadField
          label="证据截图"
          hint="证据会保存在私有存储中，仅通过限时授权链接供管理员或已公开记录访问。支持一次上传多张图。"
          multiple
          resetToken={resetToken}
          onUploaded={setEvidenceUrls}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">情况说明</label>
          <textarea
            name="description"
            className="field min-h-36"
            placeholder="例如：什么时候下单、什么时候付款、最后一次回复是什么时候、之后有没有继续联系。"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">投稿人联系方式（可选）</label>
          <input name="submitter_contact" className="field" placeholder="例如：邮箱 / QQ / 其他可联系渠道" />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

        <button type="button" onClick={() => setNoticeOpen(true)} className="button-secondary w-full sm:w-auto">
          重新查看提交须知
        </button>

        <button type="submit" disabled={submitting || noticeOpen} className="button-primary w-full sm:w-auto">
          {submitting ? "正在提交..." : "提交记录"}
        </button>
      </form>
    </>
  );
}
