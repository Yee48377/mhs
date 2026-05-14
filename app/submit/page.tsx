import { ReportForm } from "@/components/report-form";
import { SiteShell } from "@/components/site-shell";

export default function SubmitPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">提交约稿记录</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            用于整理约稿合作中的失联记录、沟通时间线与处理进度。请尽量按时间线整理清楚，方便后续补充、更新与联系。
          </p>
        </div>
        <div className="card-surface p-6 sm:p-8">
          <ReportForm />
        </div>
      </div>
    </SiteShell>
  );
}
