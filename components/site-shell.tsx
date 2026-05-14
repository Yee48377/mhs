import type { ReactNode } from "react";
import Link from "next/link";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex flex-col items-center gap-3 rounded-[28px] border-[3px] border-black bg-white px-4 py-4 sm:flex-row sm:justify-between sm:rounded-full sm:py-3">
          <Link href="/" className="text-center font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
            约稿失联记录站
          </Link>

          <nav className="grid grid-cols-3 gap-2 text-sm sm:flex sm:flex-wrap sm:items-center">
            <Link href="/" className="button-secondary px-4 py-2">
              首页
            </Link>
            <Link href="/submit" className="button-secondary px-4 py-2">
              提交记录
            </Link>
            <Link href="/admin" className="button-primary px-4 py-2">
              管理
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
