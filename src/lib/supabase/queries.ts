import { cache } from "react";
import { createClient } from "./server";

// React cache() dedupes these within a single request, so the layout, the
// space layout, and the channel page share one round-trip each instead of
// firing the same Supabase query three times on every navigation.

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", userId).single();
  return data;
});

export const getSpaceChannels = cache(async (spaceId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("channels")
    .select("id, type, name, position")
    .eq("space_id", spaceId)
    .order("position");
  return data ?? [];
});

export const getMyRole = cache(async (spaceId: string, userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("space_members")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role ?? null;
});
