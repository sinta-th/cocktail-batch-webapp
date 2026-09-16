import React, { useState, useEffect, useRef } from "react";
import { Bottle } from "./Bottle";
import { BOTTLE_SIZES, CATEGORIES, COMPONENT_TYPES } from "../lib/constants";
import { fmt } from "../lib/format";
import { insertRecipe, fetchCocktailNames } from "../lib/db";
import { downloadRecipeImage } from "../lib/image";

let uidCounter = 1;
const nextId = () => uidCounter++;
const emptyRow = () => ({ id: nextId(), name: "", amount: "" });

export default function Calculator({ session, prefillIngredients, onDone, t }) {
  const STEPS = [
    { key: "ingredients", label: t.stepIngredients },
    { key: "confirm", label: t.stepConfirm },
    { key: "bottle", label: t.stepBottle },
    { key: "result", label: t.stepResult },
    { key: "category", label: t.stepAssign },
  ];

  const [step, setStep] = useState("ingredients");
  const [ingredients, setIngredients] = useState(
    prefillIngredients && prefillIngredients.length
      ? prefillIngredients.map((i) => ({ id: nextId(), name: i.name, amount: String(i.perServe) }))
      : [emptyRow(), emptyRow(), emptyRow()]
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [cocktailName, setCocktailName] = useState("");
  const [category, setCategory] = useState(null);
  const [componentType, setComponentType] = useState(null);
  const [knownCocktails, setKnownCocktails] = useState([]);
  const [matchedExisting, setMatchedExisting] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const updateRow = (id, field, value) =>
    setIngredients((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const addRow = () => setIngredients((rows) => [...rows, emptyRow()]);
  const removeRow = (id) =>
    setIngredients((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));

  const validRows = ingredients.filter((r) => r.name.trim() !== "" && Number(r.amount) > 0);
  const totalPerServe = validRows.reduce((s, r) => s + Number(r.amount), 0);
  const servingsFor = (size) => (totalPerServe > 0 ? Math.floor(size / totalPerServe) : 0);

  const goConfirm = () => {
    if (validRows.length < 1) {
      setError(t.errIngredientsMin);
      return;
    }
    setError("");
    setStep("confirm");
  };

  const chooseBottle = (size) => {
    const servings = servingsFor(size);
    if (servings < 1) {
      showToast(t.toastBottleTooSmall);
      return;
    }
    const totalUsed = Math.round(servings * totalPerServe);
    const scaled = validRows.map((r) => ({
      name: r.name.trim(),
      perServe: Number(r.amount),
      scaled: Number(r.amount) * servings,
    }));
    setResult({ bottleSize: size, servings, totalUsed, ingredients: scaled });
    setStep("result");
  };

  const goAssignStep = async () => {
    setStep("category");
    try {
      const names = await fetchCocktailNames();
      setKnownCocktails(names);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNameChange = (value) => {
    setCocktailName(value);
    const match = knownCocktails.find((c) => c.name.trim().toLowerCase() === value.trim().toLowerCase());
    if (match) {
      setMatchedExisting(match);
      setCategory(match.category);
    } else {
      setMatchedExisting(null);
    }
  };

  const saveRecipe = async () => {
    if (!cocktailName.trim()) {
      setError(t.errCocktailNameRequired);
      return;
    }
    if (!category) {
      setError(t.errCategoryRequired);
      return;
    }
    if (!componentType) {
      setError(t.errComponentTypeRequired);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const entry = await insertRecipe({
        cocktailName: cocktailName.trim(),
        category,
        componentType,
        bottleSize: result.bottleSize,
        servings: result.servings,
        totalUsed: result.totalUsed,
        ingredients: result.ingredients,
        createdBy: session.code,
      });
      setSaved(entry);
      showToast(t.toastSaved);
    } catch (e) {
      console.error(e);
      showToast(t.toastSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const startNewBatch = () => {
    setIngredients([emptyRow(), emptyRow(), emptyRow()]);
    setResult(null);
    setCocktailName("");
    setCategory(null);
    setComponentType(null);
    setMatchedExisting(null);
    setSaved(null);
    setError("");
    setStep("ingredients");
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="bc-shell">
      <div className="bc-progress">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.key}>
            {i > 0 && <div className={`bc-progress-line ${i <= stepIndex ? "bc-progress-line--done" : ""}`} />}
            <div
              className={`bc-progress-step ${i < stepIndex ? "bc-progress-step--done" : ""} ${
                i === stepIndex ? "bc-progress-step--active" : ""
              }`}
            >
              <div className="bc-progress-dot">{i < stepIndex ? "✓" : i + 1}</div>
              <div className="bc-progress-label">{s.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {step === "ingredients" && (
        <div className="bc-card" key="ingredients">
          <h2>{t.ingTitle}</h2>
          <p className="bc-card-sub">{t.ingSub}</p>

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

          {error && <div className="bc-error">{error}</div>}

          <div className="bc-actions">
            <button className="bc-btn bc-btn--primary bc-btn--full" onClick={goConfirm}>
              {t.confirmIngredientsBtn}
            </button>
          </div>
        </div>
      )}

      {step === "confirm" && (
        <div className="bc-card" key="confirm">
          <h2>{t.confirmTitle}</h2>
          <p className="bc-card-sub">{t.confirmSub}</p>

          <div className="bc-summary-list">
            {validRows.map((r) => (
              <div className="bc-summary-row" key={r.id}>
                <span>{r.name}</span>
                <span>
                  {fmt(Number(r.amount))} {t.unitMl}
                </span>
              </div>
            ))}
          </div>
          <div className="bc-summary-total">
            <span>{t.totalPerServe}</span>
            <span>
              {fmt(totalPerServe)} {t.unitMl}
            </span>
          </div>

          <div className="bc-actions">
            <button className="bc-btn bc-btn--ghost" onClick={() => setStep("ingredients")}>
              {t.editBtn}
            </button>
            <button className="bc-btn bc-btn--primary" onClick={() => setStep("bottle")}>
              {t.confirmBatchBtn}
            </button>
          </div>
        </div>
      )}

      {step === "bottle" && (
        <div className="bc-card" key="bottle">
          <h2>{t.bottleTitle}</h2>
          <p className="bc-card-sub">{t.bottleSub}</p>

          <div className="bc-bottle-grid">
            {BOTTLE_SIZES.map((size) => {
              const servings = servingsFor(size);
              const disabled = servings < 1;
              const ratio = 0.35 + (size / 1500) * 0.5;
              return (
                <div
                  key={size}
                  className={`bc-bottle-card ${disabled ? "bc-bottle-card--disabled" : ""}`}
                  onClick={() => !disabled && chooseBottle(size)}
                >
                  <Bottle ratio={disabled ? 0.12 : ratio} size={size} compact dim={disabled} />
                  <div className="bc-bottle-size">
                    {size} {t.unitMl}
                  </div>
                  <div className={`bc-bottle-servings ${disabled ? "bc-bottle-servings--muted" : ""}`}>
                    {disabled ? t.bottleInsufficient : t.bottleServings(servings)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bc-actions">
            <button className="bc-btn bc-btn--ghost bc-btn--full" onClick={() => setStep("confirm")}>
              {t.back}
            </button>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="bc-card" key="result">
          <div className="bc-result-top">
            <div className="bc-result-bottle">
              <ResultBottle result={result} />
            </div>
            <div className="bc-result-meta">
              <span className="bc-pill">{t.resultReady}</span>
              <h2>{t.resultBottleTitle(result.bottleSize)}</h2>
              <div className="bc-result-figure">
                {result.servings} <span>{t.servingsLabel}</span>
              </div>
              <p className="bc-card-sub" style={{ marginTop: 6, marginBottom: 0 }}>
                {t.resultUsage(fmt(result.totalUsed), result.bottleSize)}
              </p>
            </div>
          </div>

          <div className="bc-ing-table">
            {result.ingredients.map((i) => (
              <div className="bc-ing-row" key={i.name}>
                <span>
                  {i.name}
                  <div className="bc-ing-sub">{t.ingPerServe(fmt(i.perServe))}</div>
                </span>
                <strong>
                  {fmt(i.scaled)} {t.unitMl}
                </strong>
              </div>
            ))}
          </div>

          <div className="bc-actions">
            <button className="bc-btn bc-btn--ghost" onClick={() => setStep("bottle")}>
              {t.backAdjustBottle}
            </button>
            <button className="bc-btn bc-btn--primary" onClick={goAssignStep}>
              {t.nextBtn}
            </button>
          </div>
        </div>
      )}

      {step === "category" && result && !saved && (
        <div className="bc-card" key="category">
          <h2>{t.assignTitle}</h2>
          <p className="bc-card-sub">{t.assignSub}</p>

          <input
            className="bc-input bc-input--name"
            style={{ width: "100%", marginBottom: 8 }}
            placeholder={t.cocktailNamePlaceholder}
            value={cocktailName}
            onChange={(e) => handleNameChange(e.target.value)}
            list="bc-cocktail-names"
          />
          <datalist id="bc-cocktail-names">
            {knownCocktails.map((c) => (
              <option key={c.name} value={c.name} />
            ))}
          </datalist>

          {matchedExisting && (
            <div className="bc-existing-hint">{t.existingCocktailHint(matchedExisting.name)}</div>
          )}

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

          {error && <div className="bc-error">{error}</div>}

          <div className="bc-actions">
            <button className="bc-btn bc-btn--ghost" onClick={() => setStep("result")} disabled={saving}>
              {t.back}
            </button>
            <button className="bc-btn bc-btn--primary" onClick={saveRecipe} disabled={saving}>
              {saving ? t.savingBtn : t.saveRecipeBtn}
            </button>
          </div>
        </div>
      )}

      {step === "category" && saved && (
        <div className="bc-card" key="saved">
          <span className="bc-pill">{t.savedTitle}</span>
          <h2>{saved.cocktailName}</h2>
          <p className="bc-card-sub">
            {t.savedSub(
              saved.cocktailName,
              COMPONENT_TYPES.find((c) => c.key === saved.componentType)?.label || saved.componentType
            )}
          </p>

          <div className="bc-actions">
            <button className="bc-btn bc-btn--ghost" onClick={() => downloadRecipeImage(saved)}>
              {t.saveImageBtn2}
            </button>
            <button className="bc-btn bc-btn--primary" onClick={startNewBatch}>
              {t.newBatchBtn}
            </button>
          </div>
          <div className="bc-actions" style={{ marginTop: 10 }}>
            <button className="bc-btn bc-btn--ghost bc-btn--full" onClick={onDone}>
              {t.goToLibraryBtn}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="bc-toast">{toast}</div>}
    </div>
  );
}

function ResultBottle({ result }) {
  const [ratio, setRatio] = useState(0);
  const target = result.totalUsed / result.bottleSize;
  useEffect(() => {
    const t = setTimeout(() => setRatio(target), 120);
    return () => clearTimeout(t);
  }, [target]);
  return <Bottle ratio={ratio} size={result.bottleSize} />;
}
