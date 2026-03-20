import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function loadIdeas() {
  const { data, error } = await supabase
    .from("workspace")
    .select("ideas")
    .eq("id", 1)
    .single();
  if (error) return [];
  return data?.ideas || [];
}

export async function saveIdeas(ideas) {
  await supabase
    .from("workspace")
    .upsert({ id: 1, ideas, updated_at: new Date().toISOString() });
}
