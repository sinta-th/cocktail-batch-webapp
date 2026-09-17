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

export async function deleteRecipes(ids) {
  if (!ids.length) return;
  const { error } = await supabase.from("batches").delete().in("id", ids);
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

/* ---------- cocktail recipes (single-serve, with method/garnish/photo) ---------- */

export async function uploadCocktailPhoto(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("cocktail-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("cocktail-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchCocktailRecipes() {
  const { data, error } = await supabase
    .from("cocktail_recipes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCocktailRecipeRow);
}

export async function fetchCocktailRecipeNames() {
  const { data, error } = await supabase
    .from("cocktail_recipes")
    .select("name, category")
    .order("created_at", { ascending: true });
  if (error) throw error;
  const seen = new Map();
  (data || []).forEach((row) => {
    if (!seen.has(row.name)) seen.set(row.name, row.category);
  });
  return Array.from(seen.entries()).map(([name, category]) => ({ name, category }));
}

export async function insertCocktailRecipe(entry) {
  const { data, error } = await supabase
    .from("cocktail_recipes")
    .insert({
      name: entry.name,
      category: entry.category,
      method: entry.method,
      ingredients: entry.ingredients,
      garnish: entry.garnish || null,
      photo_url: entry.photoUrl || null,
      created_by: entry.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCocktailRecipeRow(data);
}

export async function updateCocktailRecipe(id, entry) {
  const { data, error } = await supabase
    .from("cocktail_recipes")
    .update({
      name: entry.name,
      category: entry.category,
      method: entry.method,
      ingredients: entry.ingredients,
      garnish: entry.garnish || null,
      photo_url: entry.photoUrl || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapCocktailRecipeRow(data);
}

export async function deleteCocktailRecipe(id) {
  const { error } = await supabase.from("cocktail_recipes").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteCocktailRecipes(ids) {
  if (!ids.length) return;
  const { error } = await supabase.from("cocktail_recipes").delete().in("id", ids);
  if (error) throw error;
}

function mapCocktailRecipeRow(row) {
  return {
    id: row.id,
    date: row.created_at,
    name: row.name,
    category: row.category,
    method: row.method,
    ingredients: row.ingredients,
    garnish: row.garnish,
    photoUrl: row.photo_url,
    createdBy: row.created_by,
  };
}
