import { createClient } from "@supabase/supabase-js";

let browserClient: ReturnType<typeof createClient> | null = null;



export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    }

    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return browserClient;
}

// Server-side only: use for privileged operations.
export function createSupabaseServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error("createSupabaseServiceClient can only be used on the server.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
