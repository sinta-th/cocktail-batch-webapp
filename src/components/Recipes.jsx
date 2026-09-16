import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bottle } from "./Bottle";
import EditRecipe from "./EditRecipe";
import { fetchRecipes, deleteRecipe } from "../lib/db";
import { CATEGORIES, COMPONENT_TYPES, ROLES } from "../lib/constants";
import { fmt, formatDate, ratioString } from "../lib/format";
import { downloadRecipeImage } from "../lib/image";

export default function Recipes({ session, canCreate, onReuse, t }) {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [activeCocktail, setActiveCocktail] = useState(null); // cocktail name string
  const [activeBatch, setActiveBatch] = useState(null); // recipe row
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchRecipes();
      setRecipes(data);
    } catch (e) {
      console.error(e);
      setError(t.recipesLoadError);
    } finally {
      setLoaded(true);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    setRecipes((r) => r.filter((x) => x.id !== id));
    setActiveBatch(null);
    try {
      await deleteRecipe(id);
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const canDelete = session.role === ROLES.HOST;
  const inCategory = recipes.filter((r) => r.category === activeCategory);

  // dedupe cocktail names within this category, preserve latest-first order
  const cocktailNames = [];
  inCategory.forEach((r) => {
    if (!cocktailNames.includes(r.cocktailName)) cocktailNames.push(r.cocktailName);
  });

  const batchesForCocktail = activeCocktail ? inCategory.filter((r) => r.cocktailName === activeCocktail) : [];

  const openCategory = (key) => {
    setActiveCategory(key);
    setActiveCocktail(null);
    setActiveBatch(null);
    setEditing(false);
  };

  const handleSaved = (updated) => {
    setEditing(false);
    setActiveBatch(null);
    setActiveCocktail(null);
    showToast(t.editSaved);
    load();
  };

  // ---- edit mode (host only) ----
  if (activeBatch && editing) {
    return (
      <div className="bc-shell">
        <EditRecipe recipe={activeBatch} t={t} onSaved={handleSaved} onCancel={() => setEditing(false)} />
        {toast && <div className="bc-toast">{toast}</div>}
      </div>
    );
  }

  // ---- level 3: single batch detail (animated bottle) ----
  if (activeBatch) {
    return (
      <div className="bc-shell">
        <button className="bc-btn bc-btn--ghost bc-btn--full" style={{ marginBottom: 16 }} onClick={() => setActiveBatch(null)}>
          {t.backToCocktail}
        </button>
        <div className="bc-card">
          <div className="bc-result-top">
            <div className="bc-result-bottle">
              <AnimatedBottle recipe={activeBatch} />
            </div>
            <div className="bc-result-meta">
              <span className="bc-pill">
                {COMPONENT_TYPES.find((c) => c.key === activeBatch.componentType)?.label || activeBatch.componentType}
              </span>
              <h2>{activeBatch.componentName || activeBatch.cocktailName}</h2>
              <div className="bc-result-figure">
                {activeBatch.servings} <span>{t.servingsLabel}</span>
              </div>
              <p className="bc-card-sub" style={{ marginTop: 6, marginBottom: 0 }}>
                {t.resultUsage(fmt(activeBatch.totalUsed), activeBatch.bottleSize)}
              </p>
            </div>
          </div>

          <div className="bc-ing-table">
            {activeBatch.ingredients.map((i) => (
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
          {activeBatch.ingredients.length > 1 && (
            <div className="bc-ratio-line">
              {t.ratioLabel}: <strong>{ratioString(activeBatch.ingredients.map((i) => i.perServe))}</strong>
            </div>
          )}

          <p className="bc-card-sub" style={{ marginTop: 14, marginBottom: 0 }}>
            {formatDate(activeBatch.date)} · {activeBatch.createdBy || "-"}
          </p>

          <div className="bc-actions">
            {canCreate && (
              <button className="bc-btn bc-btn--ghost" onClick={() => onReuse(activeBatch)}>
                {t.reuseBtn}
              </button>
            )}
            <button className="bc-btn bc-btn--primary" onClick={() => downloadRecipeImage(activeBatch)}>
              {t.saveImageBtn}
            </button>
          </div>
          {canDelete && (
            <div className="bc-actions" style={{ marginTop: 10 }}>
              <button className="bc-btn bc-btn--ghost" onClick={() => setEditing(true)}>
                {t.editBtn}
              </button>
              <button className="bc-btn bc-btn--ghost" onClick={() => remove(activeBatch.id)}>
                {t.delete}
              </button>
            </div>
          )}
        </div>
        {toast && <div className="bc-toast">{toast}</div>}
      </div>
    );
  }

  // ---- level 2: component batches for one cocktail ----
  if (activeCocktail) {
    return (
      <div className="bc-shell">
        <button className="bc-btn bc-btn--ghost bc-btn--full" style={{ marginBottom: 16 }} onClick={() => setActiveCocktail(null)}>
          {t.backToList}
        </button>
        <h2 style={{ fontFamily: "'Chonburi',serif", fontSize: 19, margin: "0 0 14px" }}>{activeCocktail}</h2>
        {batchesForCocktail.length === 0 ? (
          <div className="bc-empty">{t.batchListEmpty}</div>
        ) : (
          batchesForCocktail.map((r) => (
            <div className="bc-list-row bc-list-row--clickable" key={r.id} onClick={() => setActiveBatch(r)}>
              <div className="bc-list-main">
                <strong>{r.componentName || COMPONENT_TYPES.find((c) => c.key === r.componentType)?.label || r.componentType}</strong>
                <span className="bc-badge">{COMPONENT_TYPES.find((c) => c.key === r.componentType)?.label}</span>
              </div>
              <span className="bc-chevron">›</span>
            </div>
          ))
        )}
      </div>
    );
  }

  // ---- level 1: category tabs + cocktail name list ----
  return (
    <div className="bc-shell">
      <div className="bc-cat-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`bc-cat-tab ${activeCategory === c.key ? "bc-cat-tab--active" : ""}`}
            onClick={() => openCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <div className="bc-banner">{error}</div>}

      {!loaded ? (
        <div className="bc-empty">{t.loadingRecipes}</div>
      ) : cocktailNames.length === 0 ? (
        <div className="bc-empty">{t.cocktailListEmpty}</div>
      ) : (
        cocktailNames.map((name) => {
          const count = inCategory.filter((r) => r.cocktailName === name).length;
          return (
            <div className="bc-list-row bc-list-row--clickable" key={name} onClick={() => setActiveCocktail(name)}>
              <div className="bc-list-main">
                <strong>{name}</strong>
                <span className="bc-badge">{t.batchCount(count)}</span>
              </div>
              <span className="bc-chevron">›</span>
            </div>
          );
        })
      )}
      {toast && <div className="bc-toast">{toast}</div>}
    </div>
  );
}

function AnimatedBottle({ recipe }) {
  const [ratio, setRatio] = useState(0);
  const target = recipe.totalUsed / recipe.bottleSize;
  useEffect(() => {
    setRatio(0);
    const t = setTimeout(() => setRatio(target), 120);
    return () => clearTimeout(t);
  }, [target, recipe.id]);
  return <Bottle ratio={ratio} size={recipe.bottleSize} />;
}
