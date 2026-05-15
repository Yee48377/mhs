import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { EvidenceGallery } from "@/components/evidence-gallery";
import { SiteShell } from "@/components/site-shell";
import { StatusBadge } from "@/components/status-badge";
import { getPublicEvidenceGallery, getPublicReportById, getPublicSupplementEntries, getReportHistory } from "@/lib/queries";
import { formatDate, getAdminActionLabel, getRecordIndexKey } from "@/lib/utils";

export const revalidate = 300;

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const [report, evidenceItems, supplementEntries, historyEntries] = await Promise.all([
    getPublicReportById(params.id),
    getPublicEvidenceGallery(params.id),
    getPublicSupplementEntries(params.id),
    getReportHistory(params.id)
  ]);

  if (!report) {
    notFound();
  }

  const indexKey = getRecordIndexKey(report.target_id);

  return (
    <SiteShell>
      <section className="space-y-6">
        <div className="card-surface p-6 sm:p-8">
          <p className="eyebrow">Record</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {report.target_id}
            </h1>
            <StatusBadge status={report.status} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-full border border-white/90 bg-white px-3 py-1">{report.platform}</span>
            <span className="rounded-full border border-white/90 bg-white px-3 py-1">
              失联 {report.days_missing} 天
            </span>
            <span className="rounded-full border border-white/90 bg-white px-3 py-1">
              投稿 {report.report_count} 次
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="card-muted px-4 py-4 text-sm text-slate-600">
              <div className="text-xs text-slate-400">最后联系日期</div>
              <div className="mt-2 font-medium text-ink">{formatDate(report.last_contact)}</div>
            </div>
            <div className="card-muted px-4 py-4 text-sm text-slate-600">
              <div className="text-xs text-slate-400">公开状态</div>
              <div className="mt-2 font-medium text-ink">{report.is_public ? "已公开" : "未公开"}</div>
            </div>
          </div>

          <div className="glass-divider mt-6 pt-6">
            <h2 className="font-display text-xl font-semibold tracking-tight">时间线</h2>
            <div className="mt-5 space-y-4">
              <article className="relative pl-6">
                <div className="absolute left-0 top-2 h-3 w-3 rounded-full border border-accent-300 bg-accent-100" />
                <div className="absolute left-[5px] top-5 h-[calc(100%+1.25rem)] w-px bg-slate-200" />
                <p className="text-xs tracking-wide text-slate-400">主记录</p>
                <p className="mt-2 text-sm leading-8 text-slate-700">{report.description}</p>
                <p className="mt-2 text-xs text-slate-500">公开时间：{formatDate(report.created_at)}</p>
              </article>

              {supplementEntries.map((entry, index) => (
                <article key={entry.id} className="relative pl-6">
                  <div className="absolute left-0 top-2 h-3 w-3 rounded-full border border-slate-300 bg-white" />
                  {index < supplementEntries.length - 1 ? (
                    <div className="absolute left-[5px] top-5 h-[calc(100%+1.25rem)] w-px bg-slate-200" />
                  ) : null}
                  <p className="text-xs tracking-wide text-slate-400">补充说明 / 更正</p>
                  <p className="mt-2 text-sm leading-8 text-slate-700">{entry.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(entry.created_at)}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href={`/supplement?reportId=${report.id}`} className="button-secondary min-h-[56px]">
              补充这条记录
            </Link>
            <Link href={`/appeal?reportId=${report.id}`} className="button-secondary min-h-[56px]">
              说明 / 更正这条记录
            </Link>
          </div>

          <div className="mt-3 grid gap-3">
            <Link
              href={`/records/${encodeURIComponent(indexKey)}` as Route}
              className="card-muted flex items-center justify-between gap-3 px-4 py-4 text-sm text-slate-600"
            >
              <span>查看 {indexKey} 分类下的其他记录</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="glass-divider mt-6 pt-6">
            <h2 className="font-display text-xl font-semibold tracking-tight">证据预览</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              当前会展示主证据和已补充的图片材料，方便直接浏览，不需要再逐个点链接。
            </p>
            <div className="mt-4">
              <EvidenceGallery
                reportId={report.id}
                initialItems={evidenceItems as Array<{ id: string; label: string; description: string; signedUrl: string }>}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-4">
            <Link href="/" className="text-sm font-medium text-accent-600">
              返回首页索引
            </Link>
          </div>

          {historyEntries.length > 0 ? (
            <div className="glass-divider mt-6 pt-6">
              <h2 className="font-display text-xl font-semibold tracking-tight">处理记录</h2>
              <div className="mt-4 space-y-3">
                {historyEntries.map((entry) => (
                  <div key={entry.id} className="card-muted px-4 py-4 text-sm text-slate-600">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium text-ink">{getAdminActionLabel(entry.action)}</span>
                      <span className="text-xs text-slate-500">{formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </SiteShell>
  );
}
