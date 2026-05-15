"use client";

import { useState } from "react";
import { Eye, EyeOff, Trash2, CheckCircle2, LogOut, PlusSquare } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type { AdminActionLog, CommissionReport, EvidenceSubmission, SubmissionEvent } from "@/types";
import { formatDate, getAdminActionLabel, parseStoredEvidenceUrls } from "@/lib/utils";

interface AdminDashboardProps {
  reports: CommissionReport[];
  evidenceSubmissions: EvidenceSubmission[];
  flaggedEvents: SubmissionEvent[];
  adminActionLogs: AdminActionLog[];
  warnings: {
    submissionEventsUnavailable: boolean;
    adminActionLogsUnavailable: boolean;
  };
}

function formatFlags(flags: unknown) {
  if (!Array.isArray(flags)) {
    return [];
  }

  return flags.filter((value): value is string => typeof value === "string");
}

export function AdminDashboard({ reports, evidenceSubmissions, flaggedEvents, adminActionLogs, warnings }: AdminDashboardProps) {
  const [busyId, setBusyId] = useState("");
  const [items, setItems] = useState(reports);
  const [submissions, setSubmissions] = useState(evidenceSubmissions);
  const [feedback, setFeedback] = useState("");

  async function updateReport(reportId: string, action: string) {
    setBusyId(reportId + action);
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error("更新失败");
      }

      if (action === "delete") {
        setItems((current) => current.filter((item) => item.id !== reportId));
        setFeedback("已删除该投稿。");
        return;
      }

      const result = (await response.json()) as { report: CommissionReport };
      setItems((current) => current.map((item) => (item.id === reportId ? result.report : item)));
      const labelMap: Record<string, string> = {
        publish: "已公开该记录。",
        hide: "已隐藏该记录。",
        reject: "已驳回该记录。",
        resolve: "已标记为已解决。"
      };
      setFeedback(labelMap[action] || "操作已完成。");
    } catch (error) {
      console.error(error);
      window.alert("操作失败，请检查后台配置。");
    } finally {
      setBusyId("");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  async function updateSupplement(submissionId: string, action: string) {
    const confirmMap: Record<string, string> = {
      approve: "确认要公开并入这条补充材料吗？",
      hide: "确认要隐藏这条补充材料吗？",
      delete: "确认要彻底删除这条补充材料吗？删除后无法恢复。"
    };

    if (confirmMap[action] && !window.confirm(confirmMap[action])) {
      return;
    }

    setBusyId(submissionId + action);
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/evidence/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        throw new Error("更新失败");
      }

      const labelMap: Record<string, string> = {
        approve: "已公开并入这条补充记录。",
        hide: "已隐藏这条补充记录。",
        delete: "已删除这条补充记录。"
      };

      if (action === "delete") {
        setSubmissions((current) => current.filter((item) => item.id !== submissionId));
      } else if (action === "approve") {
        setSubmissions((current) =>
          current.map((item) => (item.id === submissionId ? { ...item, review_status: "已通过" } : item))
        );
      } else if (action === "hide") {
        setSubmissions((current) =>
          current.map((item) => (item.id === submissionId ? { ...item, review_status: "已拒绝" } : item))
        );
      }

      setFeedback(labelMap[action] || "补充记录已处理。");
    } catch (error) {
      console.error(error);
      window.alert("操作失败，请检查后台配置。");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-10">
      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {warnings.adminActionLogsUnavailable || warnings.submissionEventsUnavailable ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-800">
          后台监控数据尚未完整启用。
          {warnings.adminActionLogsUnavailable ? " 处理记录与历史日志当前不可用，请先执行最新的 Supabase schema.sql。" : ""}
          {warnings.submissionEventsUnavailable ? " 异常提交监控当前不可用，请先执行最新的 Supabase schema.sql。" : ""}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">管理员后台</h1>
          <p className="mt-2 text-sm text-slate-600">处理隐藏、撤下、已解决和删除等操作，并集中查看用户补充的材料与说明。</p>
        </div>
        <button onClick={logout} className="button-secondary">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </button>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">全部投稿</h2>
          <span className="text-sm text-slate-500">{items.length} 条</span>
        </div>
        <div className="grid gap-4">
          {items.map((report) => (
            <article key={report.id} className="card-surface p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-lg font-semibold">{report.target_id}</h3>
                    <StatusBadge status={report.status} />
                    <span className="text-xs text-slate-500">{report.id}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1">{report.platform}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">失联 {report.days_missing} 天</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">公开：{report.is_public ? "是" : "否"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">已解决：{report.is_resolved ? "是" : "否"}</span>
                  </div>
                  <p className="max-w-3xl text-sm leading-7 text-slate-700">{report.description}</p>
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <div>最后联系：{formatDate(report.last_contact)}</div>
                    <div>投稿时间：{formatDate(report.created_at)}</div>
                    <div>投稿人联系方式：{report.submitter_contact || "未填写"}</div>
                    <a href={`/api/evidence-access?reportId=${report.id}`} className="text-accent-600 underline">
                      查看限时证据链接
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-64">
                  <button
                    disabled={busyId === report.id + "publish"}
                    onClick={() => updateReport(report.id, "publish")}
                    className="button-primary px-3 py-2 text-xs"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    审核公开
                  </button>
                  <button
                    disabled={busyId === report.id + "hide"}
                    onClick={() => updateReport(report.id, "hide")}
                    className="button-secondary px-3 py-2 text-xs"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    隐藏
                  </button>
                  <button
                    disabled={busyId === report.id + "reject"}
                    onClick={() => updateReport(report.id, "reject")}
                    className="button-secondary px-3 py-2 text-xs"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    驳回
                  </button>
                  <button
                    disabled={busyId === report.id + "resolve"}
                    onClick={() => updateReport(report.id, "resolve")}
                    className="button-secondary px-3 py-2 text-xs"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    已解决
                  </button>
                  <div className="col-span-1 rounded-2xl border border-dashed border-line px-3 py-2 text-xs leading-6 text-slate-500 sm:col-span-2">
                    审核重点：证据是否完整、是否暴露敏感信息、是否存在辱骂定性用语，以及是否应切换为“已解决”或“已隐藏”。
                  </div>
                  <button
                    disabled={busyId === report.id + "delete"}
                    onClick={() => updateReport(report.id, "delete")}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 hover:-translate-y-0.5 hover:bg-rose-100"
                  >
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    删除恶意投稿
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">补充材料与说明 / 更正</h2>
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <article key={submission.id} className="card-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">记录 ID：{submission.report_id}</span>
                  <span className="text-xs text-slate-500">{formatDate(submission.created_at)}</span>
                </div>
                <p className="mt-3 text-xs text-slate-500">状态：{submission.review_status}</p>
                <p className="mt-3 text-sm leading-7 text-slate-700">{submission.description}</p>
                {parseStoredEvidenceUrls(submission.evidence_url).length > 0 ? (
                  <a href={`/api/evidence-access?submissionId=${submission.id}`} className="mt-3 inline-block text-sm text-accent-600 underline">
                    查看限时补充证据
                  </a>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">这条补充目前没有附图。</p>
                )}
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    disabled={busyId === submission.id + "approve"}
                    onClick={() => updateSupplement(submission.id, "approve")}
                    className="button-primary px-3 py-2 text-xs"
                  >
                    <PlusSquare className="mr-2 h-4 w-4" />
                    公开并入
                  </button>
                  <button
                    disabled={busyId === submission.id + "hide"}
                    onClick={() => updateSupplement(submission.id, "hide")}
                    className="button-secondary px-3 py-2 text-xs"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    隐藏
                  </button>
                  <button
                    disabled={busyId === submission.id + "delete"}
                    onClick={() => updateSupplement(submission.id, "delete")}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 hover:-translate-y-0.5 hover:bg-rose-100"
                  >
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    删除
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="card-surface p-6 text-sm text-slate-500">暂时没有新的补充材料或说明。</div>
          )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">最近处理记录</h2>
          <span className="text-sm text-slate-500">{adminActionLogs.length} 条</span>
        </div>
        <div className="grid gap-3">
          {adminActionLogs.map((entry) => (
            <article key={entry.id} className="card-surface px-4 py-4 text-sm text-slate-600">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="font-medium text-ink">{getAdminActionLabel(entry.action)}</div>
                <div className="text-xs text-slate-500">{formatDate(entry.created_at)}</div>
              </div>
              <div className="mt-2 break-all text-xs text-slate-500">
                target: {entry.target_type} / {entry.target_id}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">异常提交监控</h2>
          {flaggedEvents.length > 0 ? (
            flaggedEvents.map((event) => (
              <article key={event.id} className="card-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{event.event_type}</p>
                  <p className="text-xs text-slate-500">{formatDate(event.created_at)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">状态：{event.status}</span>
                  {event.target_id ? <span className="rounded-full bg-slate-100 px-3 py-1">目标：{event.target_id}</span> : null}
                  {event.platform ? <span className="rounded-full bg-slate-100 px-3 py-1">平台：{event.platform}</span> : null}
                  {event.ip_address ? <span className="rounded-full bg-slate-100 px-3 py-1">IP：{event.ip_address}</span> : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {formatFlags(event.flags).map((flag) => (
                    <span key={flag} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                      {flag}
                    </span>
                  ))}
                </div>
                {event.error_message ? <p className="mt-3 text-sm leading-6 text-slate-600">{event.error_message}</p> : null}
              </article>
            ))
          ) : (
            <div className="card-surface p-6 text-sm text-slate-500">目前还没有被标记的异常提交。</div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">最近管理员操作</h2>
          {adminActionLogs.length > 0 ? (
            adminActionLogs.map((log) => (
              <article key={log.id} className="card-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{log.action}</p>
                  <p className="text-xs text-slate-500">{formatDate(log.created_at)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">类型：{log.target_type}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">对象：{log.target_id}</span>
                  {log.report_id ? <span className="rounded-full bg-slate-100 px-3 py-1">记录：{log.report_id}</span> : null}
                  {log.ip_address ? <span className="rounded-full bg-slate-100 px-3 py-1">IP：{log.ip_address}</span> : null}
                </div>
              </article>
            ))
          ) : (
            <div className="card-surface p-6 text-sm text-slate-500">当前还没有管理员操作日志。</div>
          )}
        </div>
      </section>
    </div>
  );
}
