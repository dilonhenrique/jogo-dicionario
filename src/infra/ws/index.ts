import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _ws: SupabaseClient | undefined;

function getWs(): SupabaseClient {
  if (_ws) return _ws;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase env vars are required");
  }

  _ws = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  return _ws;
}

export const ws = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getWs()[prop as keyof SupabaseClient];
  }
});
