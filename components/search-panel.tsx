"use client";

import { useEffect, useState } from "react";

import { ReportCard } from "@/components/report-card";
import type { CommissionReport } from "@/types";

interface SearchPanelProps {
  initialReports: CommissionReport[];
}

export function SearchPanel({ initialReports }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<CommissionReport[]>([]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const controller = new AbortController();

    if (!trimmedQuery) {
      setReports([]);
      setLoading(false);
      return () => controller.abort();
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal
        });
        const data = (await response.json()) as { reports: CommissionReport[] };
        setReports(data.reports || []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const hasSearched = query.trim().length > 0;

  return (
    <section className="space-y-7">
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="eyebrow">Search</p>
          <label htmlFor="search" className="block font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            搜索
          </label>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            输入米画师、画加、临界相关的 ID、UID 或用户名，已公开内容会立刻显示。
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-[30px] border-[3px] border-black bg-white p-2">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border-2 border-black bg-white text-slate-700">
            <span className="text-xl leading-none">🔍</span>
          </div>
          <input
            id="search"
            className="field min-h-[68px] flex-1 border-black px-4 pr-4 text-base shadow-none focus:border-black focus:ring-0 sm:text-lg"
            placeholder="输入对方 ID、UID 或用户名"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-xs text-slate-500">
          只显示已公开记录
        </span>
        <span className="rounded-full border-2 border-black bg-white px-3 py-1.5 text-xs text-slate-500">
          不展示未公开内容
        </span>
      </div>

      {hasSearched ? (
        <>
          <div className="flex items-center justify-between px-1">
            <h2 className="font-display text-lg font-semibold tracking-tight">搜索结果</h2>
            <span className="text-sm text-slate-500">{loading ? "正在查询..." : `${reports.length} 条记录`}</span>
          </div>

          <div className="grid gap-4">
            {reports.length > 0 ? (
              reports.map((report) => <ReportCard key={report.id} report={report} />)
            ) : (
              <div className="card-muted p-8 text-center text-sm leading-7 text-slate-500">
                暂时没搜到公开记录。如果你有聊天记录、付款记录或时间线截图，也可以自己补充一条。
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
