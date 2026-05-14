import { cookies } from "next/headers";

import { ADMIN_COOKIE } from "@/lib/constants";
import { hasServerEnv } from "@/lib/env";

export async function isAdminAuthenticated() {
  if (!hasServerEnv()) {
    return false;
  }

  const cookieStore = cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "authenticated";
}
