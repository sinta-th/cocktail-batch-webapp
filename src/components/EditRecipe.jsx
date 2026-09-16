import React, { useState, useMemo } from "react";
import { Bottle } from "./Bottle";
import { CATEGORIES, COMPONENT_TYPES } from "../lib/constants";
import { fmt, ratioString } from "../lib/format";
import { computeBatch } from "../lib/computeBatch";
import { updateRecipe } from "../lib/db";

let uidCounter = 1;
const nextId = () => uidCounter++;

export default function EditRecipe({ recipe, onSaved, onCancel, t }) {
  const [cocktailName, setCocktailName] = useState(recipe.cocktailName);
  const [category, setCategory] = useState(recipe.category);
  const [componentType, setComponentType] = useState(recipe.componentType);
  const [componentName, setComponentName] = useState(recipe.componentName || "");
  const [bottleSize, setBottleSize] = useState(String(recipe.bottleSize));
  const [ingredients, setIngredients] = useState(
    recipe.ingredients.map((i) => ({ id: nextId(), name: i.name, amount: String(i.perServe) }))
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateRow = (id, field, value) =>
    setIngredients((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const addRow = () => setIngredients((rows) => [...rows, { id: nextId(), name: "", amount: "" }]);
  const removeRow = (id) =>
    setIngredients((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));

  const preview = useMemo(() => computeBatch(ingredients, Number(bottleSize)), [ingredients, bottleSize]);

  const save = async () => {
    if (!cocktailName.trim() || !category || !componentType || !preview) {
      setError(t.errEditInvalid);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const updated = await updateRecipe(recipe.id, {
        cocktailName: cocktailName.trim(),
        category,
        componentType,
        componentName: componentName.trim(),
        bottleSize: Number(bottleSize),
        servings: preview.servings,
        totalUsed: preview.totalUsed,
        ingredients: preview.ingredients,
      });
      onSaved(updated);
    } catch (e) {
      console.error(e);
      setError(t.errEditFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bc-card">
      <h2>{t.editRecipeTitle}</h2>
      <p className="bc-card-sub">{t.editRecipeSub}</p>

      <input
        className="bc-input bc-input--name"
        style={{ width: "100%", marginBottom: 10 }}
        placeholder={t.cocktailNamePlaceholder}
        value={cocktailName}
        onChange={(e) => setCocktailName(e.target.value)}
      />
      <input
        className="bc-input bc-input--name"
        style={{ width: "100%", marginBottom: 10 }}
        placeholder={t.componentNamePlaceholder}
        value={componentName}
        onChange={(e) => setComponentName(e.target.value)}
      />

      <p className="bc-field-label">{t.categoryLabel}</p>
      <div className="bc-category-grid">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`bc-category-chip ${category === c.key ? "bc-category-chip--active" : ""}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="bc-field-label">{t.componentTypeLabel}</p>
      <div className="bc-category-grid">
        {COMPONENT_TYPES.map((c) => (
          <button
            key={c.key}
            className={`bc-category-chip ${componentType === c.key ? "bc-category-chip--active" : ""}`}
            onClick={() => setComponentType(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="bc-field-label">{t.ingTitle}</p>
      {ingredients.map((row) => (
        <div className="bc-row" key={row.id}>
          <input
            className="bc-input bc-input--name"
            placeholder={t.ingNamePlaceholder}
            value={row.name}
            onChange={(e) => updateRow(row.id, "name", e.target.value)}
          />
          <div className="bc-amount-wrap">
            <input
              className="bc-input bc-input--amount"
              placeholder="0"
              type="number"
              min="0"
              inputMode="decimal"
              value={row.amount}
              onChange={(e) => updateRow(row.id, "amount", e.target.value)}
            />
            <span className="bc-unit">{t.unitMl}</span>
          </div>
          <button
            className="bc-remove"
            onClick={() => removeRow(row.id)}
            disabled={ingredients.length <= 1}
            aria-label="remove"
          >
            ×
          </button>
        </div>
      ))}
      <button className="bc-add-btn" onClick={addRow}>
        {t.addIngredientBtn}
      </button>

      <p className="bc-field-label">{t.editBottleSizeLabel}</p>
      <div className="bc-amount-wrap" style={{ marginBottom: 4 }}>
        <input
          className="bc-input bc-input--amount"
          style={{ flex: 1 }}
          type="number"
          min="1"
          inputMode="numeric"
          value={bottleSize}
          onChange={(e) => setBottleSize(e.target.value)}
        />
        <span className="bc-unit">{t.unitMl}</span>
      </div>

      {preview && (
        <div className="bc-edit-preview">
          <div className="bc-result-bottle" style={{ margin: "0 auto 10px" }}>
            <Bottle ratio={preview.totalUsed / Number(bottleSize)} size={Number(bottleSize)} compact />
          </div>
          <p className="bc-field-label" style={{ marginTop: 0 }}>{t.livePreviewLabel}</p>
          <p className="bc-card-sub" style={{ margin: 0 }}>
            {preview.partial ? t.partialScaleNote(preview.servings) : t.bottleServings(preview.servings)}
            {" · "}
            {t.resultUsage(fmt(preview.totalUsed), Number(bottleSize))}
          </p>
          {preview.ingredients.length > 1 && (
            <p className="bc-ratio-line" style={{ marginBottom: 0 }}>
              {t.ratioLabel}: <strong>{ratioString(preview.ingredients.map((i) => i.perServe))}</strong>
            </p>
          )}
        </div>
      )}

      {error && <div className="bc-error">{error}</div>}

      <div className="bc-actions">
        <button className="bc-btn bc-btn--ghost" onClick={onCancel} disabled={saving}>
          {t.cancelBtn}
        </button>
        <button className="bc-btn bc-btn--primary" onClick={save} disabled={saving}>
          {saving ? t.savingChangesBtn : t.saveChangesBtn}
        </button>
      </div>
    </div>
  );
}
