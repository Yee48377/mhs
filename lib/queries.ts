import { hasServerEnv } from "@/lib/env";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase";
import { parseStoredEvidenceUrls } from "@/lib/utils";

export async function getPlatformStats() {
  if (!hasServerEnv()) {
    return {
      resolvedCount: 0,
      publicCount: 0
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const [{ count: resolvedCount }, { count: publicCount }] = await Promise.all([
      supabase
        .from("commission_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "已解决"),
      supabase
        .from("commission_reports")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true)
        .in("status", ["已公开", "已解决"])
    ]);

    return {
      resolvedCount: resolvedCount || 0,
      publicCount: publicCount || 0
    };
  } catch (error) {
    console.error("getPlatformStats fallback:", error);
    return {
      resolvedCount: 0,
      publicCount: 0
    };
  }
}

export async function getPublicReports(limit?: number) {
  if (!hasServerEnv()) {
    return [];
  }

  try {
    const supabase = createAdminSupabaseClient();
    let query = supabase
      .from("commission_reports")
      .select("*")
      .eq("is_public", true)
      .in("status", ["已公开", "已解决"])
      .order("created_at", { ascending: false });

    if (typeof limit === "number") {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("getPublicReports fallback:", error);
    return [];
  }
}

export async function getPublicReportById(id: string) {
  if (!hasServerEnv()) {
    return null;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("commission_reports")
      .select("*")
      .eq("id", id)
      .eq("is_public", true)
      .in("status", ["已公开", "已解决"])
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("getPublicReportById fallback:", error);
    return null;
  }
}

export async function getPublicEvidenceGallery(reportId: string) {
  if (!hasServerEnv()) {
    return [];
  }

  try {
    const supabase = createAdminSupabaseClient();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "evidence";
    const { data: report, error: reportError } = await supabase
      .from("commission_reports")
      .select("id, target_id, evidence_url, is_public, status")
      .eq("id", reportId)
      .single();

    if (reportError || !report || !report.is_public || !["已公开", "已解决"].includes(report.status)) {
      return [];
    }

    const { data: supplements, error: supplementsError } = await supabase
      .from("report_evidence_submissions")
      .select("id, description, evidence_url, created_at")
      .eq("report_id", reportId)
      .eq("review_status", "已通过")
      .order("created_at", { ascending: true });

    if (supplementsError) {
      throw supplementsError;
    }

    const items = [
      ...parseStoredEvidenceUrls(report.evidence_url).map((url, index) => ({
        id: `report-${report.id}-${index}`,
        label: `主证据 ${index + 1}`,
        description: "投稿时提交的主证据截图",
        evidence_url: url
      })),
      ...(supplements || []).flatMap((submission, index) =>
        parseStoredEvidenceUrls(submission.evidence_url).map((url, imageIndex) => ({
          id: `${submission.id}-${imageIndex}`,
          label: `补充证据 ${index + 1}-${imageIndex + 1}`,
          description: submission.description,
          evidence_url: url
        }))
      )
    ];

    const signedItems = await Promise.all(
      items.map(async (item) => {
        if (item.evidence_url.startsWith("http://") || item.evidence_url.startsWith("https://")) {
          return { ...item, signedUrl: item.evidence_url };
        }

        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(item.evidence_url, 60 * 10);

        if (error || !data?.signedUrl) {
          return null;
        }

        return {
          ...item,
          signedUrl: data.signedUrl
        };
      })
    );

    return signedItems.filter(Boolean);
  } catch (error) {
    console.error("getPublicEvidenceGallery fallback:", error);
    return [];
  }
}

export async function getPublicSupplementEntries(reportId: string) {
  if (!hasServerEnv()) {
    return [];
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("report_evidence_submissions")
      .select("id, description, created_at")
      .eq("report_id", reportId)
      .eq("review_status", "已通过")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("getPublicSupplementEntries fallback:", error);
    return [];
  }
}

export async function searchPublicReports(query: string) {
  if (!hasServerEnv()) {
    return [];
  }

  try {
    const supabase = createAdminSupabaseClient();
    let builder = supabase
      .from("commission_reports")
      .select("*")
      .eq("is_public", true)
      .in("status", ["已公开", "已解决"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (query.trim()) {
      builder = builder.or(`target_id.ilike.%${query.trim()}%,platform.ilike.%${query.trim()}%`);
    }

    const { data, error } = await builder;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("searchPublicReports fallback:", error);
    return [];
  }
}

export async function getAdminDashboardData() {
  if (!hasServerEnv()) {
    return {
      reports: [],
      evidenceSubmissions: [],
      flaggedEvents: [],
      adminActionLogs: []
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const [
      { data: reports, error: reportsError },
      { data: evidence, error: evidenceError },
      { data: flaggedEvents, error: flaggedEventsError },
      { data: adminActionLogs, error: adminActionLogsError }
    ] = await Promise.all([
      supabase.from("commission_reports").select("*").order("created_at", { ascending: false }),
      supabase.from("report_evidence_submissions").select("*").order("created_at", { ascending: false }),
      supabase
        .from("submission_events")
        .select("*")
        .not("flags", "is", null)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("admin_action_logs").select("*").order("created_at", { ascending: false }).limit(20)
    ]);

    if (reportsError) {
      throw reportsError;
    }

    if (evidenceError) {
      throw evidenceError;
    }

    if (flaggedEventsError) {
      console.error("flagged events unavailable:", flaggedEventsError);
    }

    if (adminActionLogsError) {
      console.error("admin action logs unavailable:", adminActionLogsError);
    }

    return {
      reports,
      evidenceSubmissions: evidence,
      flaggedEvents: flaggedEvents || [],
      adminActionLogs: adminActionLogs || []
    };
  } catch (error) {
    console.error("getAdminDashboardData fallback:", error);
    return {
      reports: [],
      evidenceSubmissions: [],
      flaggedEvents: [],
      adminActionLogs: []
    };
  }
}
