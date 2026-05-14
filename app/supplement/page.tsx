import { EvidenceForm } from "@/components/evidence-form";
import { SiteShell } from "@/components/site-shell";
import { getPublicReportById } from "@/lib/queries";

export default async function SupplementPage({
  searchParams
}: {
  searchParams?: { reportId?: string };
}) {
  const report = searchParams?.reportId ? await getPublicReportById(searchParams.reportId) : null;

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">补充材料</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            如果某条已有记录还想补截图、补时间线，或者更新后续进展，可以从具体记录进入，在这条记录下面继续补充。
          </p>
        </div>
        <div className="card-surface p-6 sm:p-8">
          <EvidenceForm
            initialReportId={report?.id || ""}
            initialReportTarget={report?.target_id || ""}
          />
        </div>
      </div>
    </SiteShell>
  );
}
