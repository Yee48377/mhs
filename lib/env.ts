const requiredPublicVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

const requiredServerVars = ["SUPABASE_SERVICE_ROLE_KEY", "ADMIN_PASSWORD"] as const;

function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function hasPublicEnv() {
  return requiredPublicVars.every((name) => Boolean(process.env[name]));
}

export function hasServerEnv() {
  return hasPublicEnv() && requiredServerVars.every((name) => Boolean(process.env[name]));
}

export function getPublicEnv() {
  return {
    supabaseUrl: readEnv(requiredPublicVars[0]),
    supabaseAnonKey: readEnv(requiredPublicVars[1]),
    storageBucket:
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
      process.env.SUPABASE_STORAGE_BUCKET ||
      "evidence"
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    serviceRoleKey: readEnv(requiredServerVars[0]),
    adminPassword: readEnv(requiredServerVars[1])
  };
}
