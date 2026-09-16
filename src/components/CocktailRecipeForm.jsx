import React, { useState } from "react";
import { CATEGORIES, METHODS, UNITS } from "../lib/constants";
import { insertCocktailRecipe, updateCocktailRecipe, uploadCocktailPhoto } from "../lib/db";

let uidCounter = 1;
const nextId = () => uidCounter++;
const emptyRow = () => ({ id: nextId(), name: "", amount: "", unit: "ml" });

export default function CocktailRecipeForm({ session, initial, onSaved, onCancel, t }) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || null);
  const [method, setMethod] = useState(initial?.method || null);
  const [garnish, setGarnish] = useState(initial?.garnish || "");
  const [ingredients, setIngredients] = useState(
    initial?.ingredients?.length
      ? initial.ingredients.map((i) => ({ id: nextId(), name: i.name, amount: String(i.amount), unit: i.unit || "ml" }))
      : [emptyRow(), emptyRow(), emptyRow()]
  );
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initial?.photoUrl || "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateRow = (id, field, value) =>
    setIngredients((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const addRow = () => setIngredients((rows) => [...rows, emptyRow()]);
  const removeRow = (id) =>
    setIngredients((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoUrl("");
  };

  const save = async () => {
    const validRows = ingredients.filter((r) => r.name.trim() !== "" && Number(r.amount) > 0);
    if (!name.trim() || !category || !method || validRows.length < 1) {
      setError(t.errCocktailRecipeInvalid);
      return;
    }
    setError("");
    setSaving(true);
    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        setUploadingPhoto(true);
        try {
          finalPhotoUrl = await uploadCocktailPhoto(photoFile);
        } catch (e) {
          console.error(e);
          setError(t.errPhotoUploadFailed);
          setSaving(false);
          setUploadingPhoto(false);
          return;
        }
        setUploadingPhoto(false);
      }
      const entry = {
        name: name.trim(),
        category,
        method,
        ingredients: validRows.map((r) => ({ name: r.name.trim(), amount: Number(r.amount), unit: r.unit })),
        garnish: garnish.trim(),
        photoUrl: finalPhotoUrl,
        createdBy: session.code,
      };
      const saved = isEdit ? await updateCocktailRecipe(initial.id, entry) : await insertCocktailRecipe(entry);
      onSaved(saved);
    } catch (e) {
      console.error(e);
      setError(t.errEditFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bc-card">
      <h2>{isEdit ? t.editCocktailRecipeTitle : t.newCocktailRecipeTitle}</h2>

      <input
        className="bc-input bc-input--name"
        style={{ width: "100%", marginBottom: 14 }}
        placeholder={t.cocktailNamePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
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

      <p className="bc-field-label">{t.methodLabel}</p>
      <div className="bc-category-grid">
        {METHODS.map((m) => (
          <button
            key={m.key}
            className={`bc-category-chip ${method === m.key ? "bc-category-chip--active" : ""}`}
            onClick={() => setMethod(m.key)}
          >
            {m.label}
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
          <input
            className="bc-input bc-input--amount"
            style={{ maxWidth: 70 }}
            placeholder="0"
            type="number"
            min="0"
            inputMode="decimal"
            value={row.amount}
            onChange={(e) => updateRow(row.id, "amount", e.target.value)}
          />
          <select
            className="bc-input bc-select bc-unit-select"
            value={row.unit}
            onChange={(e) => updateRow(row.id, "unit", e.target.value)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
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

      <p className="bc-field-label">{t.garnishLabel}</p>
      <input
        className="bc-input bc-input--name"
        style={{ width: "100%", marginBottom: 14 }}
        placeholder={t.garnishPlaceholder}
        value={garnish}
        onChange={(e) => setGarnish(e.target.value)}
      />

      <p className="bc-field-label">{t.photoLabel}</p>
      {photoPreview ? (
        <div className="bc-photo-preview-wrap">
          <img src={photoPreview} alt="" className="bc-photo-preview" />
          <button className="bc-delete-btn" onClick={removePhoto} type="button">
            {t.removePhotoBtn}
          </button>
        </div>
      ) : (
        <label className="bc-photo-upload-btn">
          {t.uploadPhotoBtn}
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        </label>
      )}

      {error && <div className="bc-error">{error}</div>}

      <div className="bc-actions">
        <button className="bc-btn bc-btn--ghost" onClick={onCancel} disabled={saving}>
          {t.cancelBtn}
        </button>
        <button className="bc-btn bc-btn--primary" onClick={save} disabled={saving}>
          {uploadingPhoto ? t.uploadingPhotoBtn : saving ? t.savingChangesBtn : t.saveCocktailRecipeBtn}
        </button>
      </div>
    </div>
  );
}
