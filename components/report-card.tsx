import { ChevronRight, ExternalLink, MessageSquareText, ShieldCheck, UserRoundSearch } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { CommissionReport } from "@/types";
import { formatDate } from "@/lib/utils";

export function ReportCard({ report }: { report: CommissionReport }) {
  return (
    <article className="card-surface p-5 hover:-translate-y-1 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-xl font-semibold tracking-tight">{report.target_id}</h3>
            <StatusBadge status={report.status} />
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <span className="rounded-full border border-white/90 bg-white/72 px-3 py-1">{report.platform}</span>
            <span className="rounded-full border border-white/90 bg-white/72 px-3 py-1">失联 {report.days_missing} 天</span>
            <span className="rounded-full border border-white/90 bg-white/72 px-3 py-1">投稿 {report.report_count} 次</span>
          </div>
        </div>
        <div className="rounded-[22px] border border-white/90 bg-white/72 px-4 py-3 text-sm text-slate-500">
          最后联系日期
          <div className="mt-1 font-medium text-ink">{formatDate(report.last_contact)}</div>
        </div>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-700">{report.description}</p>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <div className="card-muted flex items-center gap-3 px-4 py-3">
          <UserRoundSearch className="h-4 w-4 text-accent-500" />
          <span>公开状态：{report.is_public ? "已审核公开" : "审核中"}</span>
        </div>
        <a
          href={`/api/evidence-access?reportId=${report.id}`}
          className="card-muted flex items-center justify-between gap-3 px-4 py-3 hover:border-accent-200"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent-500" />
            <span className="truncate">查看限时证据链接</span>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Link href={`/reports/${report.id}`} className="inline-flex items-center text-sm font-medium text-accent-600">
          查看这条记录
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
        <Link href={`/appeal?reportId=${report.id}`} className="text-sm font-medium text-slate-600">
          说明 / 更正
        </Link>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-white/90 bg-white/72 px-4 py-3 text-xs leading-6 text-slate-500">
        <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p>公开内容仅代表投稿者提交的时间线与证据陈述，不构成平台结论。证据文件通过短时授权链接提供，以减少隐私扩散风险。</p>
      </div>
    </article>
  );
}
