// Given ingredient rows ({name, amount}) and a target bottle size (ml),
// returns { servings, totalUsed, ingredients, partial } or null if not computable.
// Mirrors the logic in Calculator.jsx's chooseBottle: fits whole servings when
// possible, otherwise (bottleSize smaller than one full serving) scales every
// ingredient proportionally to land exactly on the requested volume.
export function computeBatch(rows, bottleSize) {
  const validRows = rows.filter((r) => r.name.trim() !== "" && Number(r.amount) > 0);
  const totalPerServe = validRows.reduce((s, r) => s + Number(r.amount), 0);
  if (validRows.length < 1 || totalPerServe <= 0 || !bottleSize || bottleSize <= 0) return null;

  const servings = Math.floor(bottleSize / totalPerServe);

  if (servings < 1) {
    const scaleFactor = bottleSize / totalPerServe;
    const ingredients = validRows.map((r) => ({
      name: r.name.trim(),
      perServe: Number(r.amount),
      scaled: Math.round(Number(r.amount) * scaleFactor * 100) / 100,
    }));
    const totalUsed = Math.round(ingredients.reduce((s, i) => s + i.scaled, 0));
    return { servings: Math.round(scaleFactor * 100) / 100, totalUsed, ingredients, partial: true };
  }

  const totalUsed = Math.round(servings * totalPerServe);
  const ingredients = validRows.map((r) => ({
    name: r.name.trim(),
    perServe: Number(r.amount),
    scaled: Number(r.amount) * servings,
  }));
  return { servings, totalUsed, ingredients, partial: false };
}
