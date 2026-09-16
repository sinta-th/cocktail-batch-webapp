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
// Each row is one component batch (liquor / cordial / syrup / pre_mixed)
// belonging to a named cocktail/mocktail ("cocktail_name" + "category").

export async function fetchRecipes() {
  const { data, error } = await supabase.from("batches").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRecipeRow);
}

export async function fetchCocktailNames() {
  const { data, error } = await supabase.from("batches").select("cocktail_name, category").order("created_at", { ascending: true });
  if (error) throw error;
  const seen = new Map();
  (data || []).forEach((row) => {
    if (!seen.has(row.cocktail_name)) seen.set(row.cocktail_name, row.category);
  });
  return Array.from(seen.entries()).map(([name, category]) => ({ name, category }));
}

export async function insertRecipe(entry) {
  const { data, error } = await supabase
    .from("batches")
    .insert({
      cocktail_name: entry.cocktailName,
      category: entry.category,
      component_type: entry.componentType,
      component_name: entry.componentName || null,
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

export async function updateRecipe(id, entry) {
  const { data, error } = await supabase
    .from("batches")
    .update({
      cocktail_name: entry.cocktailName,
      category: entry.category,
      component_type: entry.componentType,
      component_name: entry.componentName || null,
      bottle_size: entry.bottleSize,
      servings: entry.servings,
      total_used: entry.totalUsed,
      ingredients: entry.ingredients,
    })
    .eq("id", id)
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
    cocktailName: row.cocktail_name,
    category: row.category,
    componentType: row.component_type,
    componentName: row.component_name,
    bottleSize: row.bottle_size,
    servings: row.servings,
    totalUsed: row.total_used,
    ingredients: row.ingredients,
    createdBy: row.created_by,
  };
}
