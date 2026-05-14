import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, FileClock, SearchCheck, ShieldEllipsis } from "lucide-react";

import { SearchPanel } from "@/components/search-panel";
import { SiteShell } from "@/components/site-shell";
import { getPlatformStats, getPublicReports } from "@/lib/queries";
import { getRecordIndexKey } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const [allReports, stats] = await Promise.all([getPublicReports(), getPlatformStats()]);
  const indexedReports = [...allReports].sort((a, b) => a.target_id.localeCompare(b.target_id, "zh-CN"));
  const groupedReports = indexedReports.reduce<Record<string, typeof indexedReports>>((groups, report) => {
    const key = getRecordIndexKey(report.target_id);
    groups[key] = [...(groups[key] || []), report];
    return groups;
  }, {});
  const orderedGroupKeys = Object.keys(groupedReports).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b, "en");
  });

  return (
    <SiteShell>
      <section className="space-y-5">
        <div className="section-frame">
          <div className="card-surface p-6 sm:p-8">
            <SearchPanel initialReports={allReports} />
          </div>
        </div>

        <div id="record-index" className="space-y-4">
          <div>
            <p className="eyebrow">Index</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">公开记录索引</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {orderedGroupKeys.map((key) => (
              <Link
                key={key}
                href={`/records/${encodeURIComponent(key)}` as Route}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
              >
                {key}
              </Link>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {orderedGroupKeys.map((key) => (
              <Link
                key={key}
                href={`/records/${encodeURIComponent(key)}` as Route}
                className="card-muted px-4 py-4 hover:border-accent-200"
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-lg font-semibold text-ink">{key}</div>
                  <div className="text-xs text-slate-500">{groupedReports[key].length} 条</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="section-frame">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="card-surface overflow-hidden p-6 sm:p-9">
              <div className="eyebrow">Commission Platforms</div>
              <div className="mt-4 inline-flex rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1 text-xs font-medium text-accent-600">
                米画师 / 画加 / 临界 / 其他约稿平台
              </div>
              <h1 className="mt-5 max-w-3xl text-center font-display text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
                约稿失联记录站
              </h1>
              <p className="mt-4 max-w-2xl text-center text-base leading-8 text-slate-600 sm:text-xl">
                用于整理约稿合作中的失联记录、沟通时间线与处理进度。支持画师失联、单主失联等情况，仅作为信息整理与联系用途。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/submit" className="button-primary">
                  提交交易记录
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="#record-index" className="button-secondary">
                  查看公开索引
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="card-muted px-5 py-5">
                <SearchCheck className="h-5 w-5 text-accent-500" />
                <p className="mt-4 text-sm font-medium text-ink">只看已公开的记录</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">搜索结果只展示公开可见内容，未公开记录不会显示。</p>
              </div>
              <div className="card-muted px-5 py-5">
                <FileClock className="h-5 w-5 text-accent-500" />
                <p className="mt-4 text-sm font-medium text-ink">证据默认私密保存</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">截图和补充材料走私有存储，不会直接公开原始文件地址。</p>
              </div>
              <div className="card-muted px-5 py-5">
                <ShieldEllipsis className="h-5 w-5 text-accent-500" />
                <p className="mt-4 text-sm font-medium text-ink">支持补充与更正</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">公开页面会尽量隐藏敏感信息，并提供申诉、补充与更新渠道。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="public-index" className="mt-8">
        <div className="section-frame">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="card-surface p-6">
              <p className="eyebrow">Overview</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">平台概览</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="card-muted px-4 py-4">
                  <div className="text-xs text-slate-500">已解决记录</div>
                  <div className="mt-2 font-display text-4xl font-semibold tracking-tight">{stats.resolvedCount}</div>
                </div>
                <div className="card-muted px-4 py-4">
                  <div className="text-xs text-slate-500">公开记录</div>
                  <div className="mt-2 font-display text-4xl font-semibold tracking-tight">{stats.publicCount}</div>
                </div>
              </div>
            </div>
            <div className="card-surface p-6">
              <p className="eyebrow">Rules</p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight">平台规则与隐私说明</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <p>本平台仅提供用户自行提交的信息记录与查询服务，用于整理沟通时间线、处理状态及相关证据材料，不对任何个人或事件作事实认定、信誉评价或法律结论。</p>
                <p>所有内容均由提交者自行提供并承担责任。平台不会主动验证信息真实性，也不鼓励争吵、骚扰、围攻、人肉搜索或其他可能伤害他人的行为。</p>
                <p>为保护隐私与安全：</p>
                <p>禁止公开身份证件、住址、电话、邮箱、支付记录、聊天账号等敏感个人信息；上传截图前请自行打码；禁止发布未成年人隐私信息；禁止恶意造谣、冒充、伪造证据或引导网络暴力。</p>
                <p>平台会尽量隐藏敏感信息，并保留删除、隐藏或限制展示内容的权利。</p>
                <p>如果相关记录存在错误、争议、已经解决，或涉及隐私与安全问题，当事人可以通过补充或说明 / 更正渠道提交内容。平台会根据情况进行补充标注、调整可见性或删除内容。</p>
                <p>继续使用或提交内容，即视为同意上述规则。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 px-6 py-4 text-center text-sm leading-7 text-slate-500">
        本站内容由用户提交，不保证完全真实。
      </footer>
    </SiteShell>
  );
}
