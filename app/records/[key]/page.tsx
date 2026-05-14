import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportCard } from "@/components/report-card";
import { SiteShell } from "@/components/site-shell";
import { getPublicReports } from "@/lib/queries";
import { getRecordIndexKey } from "@/lib/utils";

export const revalidate = 300;

export default async function RecordIndexPage({ params }: { params: { key: string } }) {
  const key = decodeURIComponent(params.key).toUpperCase();
  const reports = await getPublicReports();
  const filtered = reports
    .filter((report) => getRecordIndexKey(report.target_id) === key)
    .sort((a, b) => a.target_id.localeCompare(b.target_id, "zh-CN"));

  if (filtered.length === 0) {
    notFound();
  }

  return (
    <SiteShell>
      <section className="space-y-5">
        <div className="card-surface p-6 sm:p-8">
          <p className="eyebrow">Index</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            {key} 分类记录
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            当前分组下共有 {filtered.length} 条公开记录。点进单条记录可以查看完整时间线和证据预览。
          </p>
          <div className="mt-4">
            <Link href="/" className="text-sm font-medium text-accent-600">
              返回首页索引
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {filtered.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
