import { createAdminSupabaseClient } from "@/lib/supabase";
import type { Json } from "@/types/supabase";

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");

  if (!forwarded) {
    return null;
  }

  return forwarded.split(",")[0]?.trim() || null;
}

function getUserAgent(request: Request) {
  return request.headers.get("user-agent");
}

export async function detectSubmissionFlags({
  eventType,
  ipAddress,
  targetId,
  evidenceCount
}: {
  eventType: string;
  ipAddress?: string | null;
  targetId?: string | null;
  evidenceCount?: number;
}) {
  const flags = new Set<string>();

  if (evidenceCount && evidenceCount >= 8) {
    flags.add("large_evidence_batch");
  }

  try {
    const supabase = createAdminSupabaseClient();

    if (ipAddress) {
      const recentIpWindow = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("submission_events")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ipAddress)
        .gte("created_at", recentIpWindow);

      if ((count || 0) >= 5) {
        flags.add("high_frequency_ip");
      }
    }

    if (targetId) {
      const recentTargetWindow = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("submission_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", eventType)
        .eq("target_id", targetId)
        .gte("created_at", recentTargetWindow);

      if ((count || 0) >= 3) {
        flags.add("burst_same_target");
      }
    }
  } catch (error) {
    console.error("detectSubmissionFlags fallback:", error);
  }

  return Array.from(flags);
}

export async function recordSubmissionEvent({
  request,
  eventType,
  status,
  recordId,
  targetId,
  platform,
  flags,
  errorMessage
}: {
  request: Request;
  eventType: string;
  status: string;
  recordId?: string | null;
  targetId?: string | null;
  platform?: string | null;
  flags?: string[];
  errorMessage?: string | null;
}) {
  try {
    const supabase = createAdminSupabaseClient();
    await supabase.from("submission_events").insert({
      event_type: eventType,
      status,
      record_id: recordId || null,
      target_id: targetId || null,
      platform: platform || null,
      ip_address: getClientIp(request),
      user_agent: getUserAgent(request),
      flags: flags && flags.length > 0 ? flags : null,
      error_message: errorMessage || null
    });
  } catch (error) {
    console.error("recordSubmissionEvent fallback:", error);
  }
}

export async function recordAdminAction({
  request,
  action,
  targetType,
  targetId,
  reportId,
  details
}: {
  request: Request;
  action: string;
  targetType: string;
  targetId: string;
  reportId?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const supabase = createAdminSupabaseClient();
    await supabase.from("admin_action_logs").insert({
      actor_label: "platform_admin",
      action,
      target_type: targetType,
      target_id: targetId,
      report_id: reportId || null,
      ip_address: getClientIp(request),
      user_agent: getUserAgent(request),
      details: (details as Json | undefined) || null
    });
  } catch (error) {
    console.error("recordAdminAction fallback:", error);
  }
}
