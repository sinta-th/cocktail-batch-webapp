import { supabase } from "../supabaseClient";

/* ---------- members ---------- */

export async function findMember(code) {
  const { data, error } = await supabase.from("members").select("*").eq("code", code).maybeSingle();
  if (error) throw error;
  return data;
}

export async function addMember(code, role) {
  const { data, error } = await supabase.from("members").insert({ code, role }).select().single();
  if (error) throw error;
  return data;
}

export async function listMembers() {
  const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteMember(id) {
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- access logs ---------- */

export async function logAccess(code, role) {
  const { error } = await supabase.from("access_logs").insert({ code, role });
  if (error) throw error;
}

export async function listAccessLogs(limit = 100) {
  const { data, error } = await supabase
    .from("access_logs")
    .select("*")
    .order("accessed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/* ---------- recipes (batches) ---------- */

export async function fetchRecipes() {
  const { data, error } = await supabase.from("batches").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRecipeRow);
}

export async function insertRecipe(entry) {
  const { data, error } = await supabase
    .from("batches")
    .insert({
      name: entry.name,
      category: entry.category,
      bottle_size: entry.bottleSize,
      servings: entry.servings,
      total_used: entry.totalUsed,
      ingredients: entry.ingredients,
      created_by: entry.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRecipeRow(data);
}

export async function deleteRecipe(id) {
  const { error } = await supabase.from("batches").delete().eq("id", id);
  if (error) throw error;
}

function mapRecipeRow(row) {
  return {
    id: row.id,
    date: row.created_at,
    name: row.name,
    category: row.category,
    bottleSize: row.bottle_size,
    servings: row.servings,
    totalUsed: row.total_used,
    ingredients: row.ingredients,
    createdBy: row.created_by,
  };
}
