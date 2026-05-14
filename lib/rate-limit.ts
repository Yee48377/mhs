import { hasServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";

type RateLimitOptions = {
  request: Request;
  key: string;
  limit: number;
  windowMs: number;
  useDatabase?: boolean;
};

type RateLimitResult = {
  limited: boolean;
  retryAfter: number;
};

type MemoryEntry = {
  count: number;
  resetAt: number;
};

const globalRateLimitStore = globalThis as typeof globalThis & {
  __commissionRateLimitStore?: Map<string, MemoryEntry>;
};

const memoryStore = globalRateLimitStore.__commissionRateLimitStore || new Map<string, MemoryEntry>();
globalRateLimitStore.__commissionRateLimitStore = memoryStore;

export function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anonymous"
  );
}

function checkMemoryRateLimit(storageKey: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = memoryStore.get(storageKey);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(storageKey, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: Math.ceil(windowMs / 1000) };
  }

  if (entry.count >= limit) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    };
  }

  entry.count += 1;
  memoryStore.set(storageKey, entry);
  return {
    limited: false,
    retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
  };
}

export async function enforceRateLimit({
  request,
  key,
  limit,
  windowMs,
  useDatabase = true
}: RateLimitOptions): Promise<RateLimitResult> {
  const ipAddress = getClientIp(request);
  const storageKey = `${key}:${ipAddress}`;
  const memoryResult = checkMemoryRateLimit(storageKey, limit, windowMs);

  if (memoryResult.limited || !useDatabase || !hasServerEnv() || ipAddress === "anonymous") {
    return memoryResult;
  }

  try {
    const supabase = createAdminSupabaseClient();
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count } = await supabase
      .from("submission_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", key)
      .eq("ip_address", ipAddress)
      .gte("created_at", since);

    if ((count || 0) >= limit) {
      return {
        limited: true,
        retryAfter: Math.max(1, Math.ceil(windowMs / 1000))
      };
    }
  } catch (error) {
    console.error("rate limit fallback:", error);
  }

  return memoryResult;
}
