import { AppealForm } from "@/components/appeal-form";
import { SiteShell } from "@/components/site-shell";
import { getPublicReportById } from "@/lib/queries";

export default async function AppealPage({
  searchParams
}: {
  searchParams?: { reportId?: string };
}) {
  const report = searchParams?.reportId ? await getPublicReportById(searchParams.reportId) : null;

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">说明 / 更正</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            如果记录有误、已经处理好了，或者你希望补充另一种说法，可以从具体记录进入，在这条记录下面继续说明。
          </p>
        </div>
        <div className="card-surface p-6 sm:p-8">
          <AppealForm
            initialReportId={report?.id || ""}
            initialReportTarget={report?.target_id || ""}
          />
        </div>
      </div>
    </SiteShell>
  );
}
