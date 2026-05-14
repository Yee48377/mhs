import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminLoginForm } from "@/components/admin-login-form";
import { SiteShell } from "@/components/site-shell";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/queries";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">平台处理后台</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">当前版本使用简单密码验证，通过服务端 Cookie 管理会话，不依赖 localStorage。证据文件使用私有存储和限时签名访问。</p>
          </div>
          <div className="card-surface p-6 sm:p-8">
            <AdminLoginForm />
          </div>
        </div>
      </SiteShell>
    );
  }

  const data = await getAdminDashboardData();

  return (
    <SiteShell>
      <AdminDashboard
        reports={data.reports}
        evidenceSubmissions={data.evidenceSubmissions}
        flaggedEvents={data.flaggedEvents}
        adminActionLogs={data.adminActionLogs}
      />
    </SiteShell>
  );
}
