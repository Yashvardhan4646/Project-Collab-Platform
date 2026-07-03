"use server";

import { createClient } from "@/lib/supabase/server";

export async function createServer(name: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_server_with_template", { p_name: name });
  if (error) throw new Error(error.message);
  return data as string;
}
