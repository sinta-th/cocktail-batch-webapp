import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bottle } from "./Bottle";
import EditRecipe from "./EditRecipe";
import { fetchRecipes, deleteRecipe, deleteRecipes } from "../lib/db";
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

  // bulk-select state (host only), separate sets for the two list levels
  const [selectModeCocktails, setSelectModeCocktails] = useState(false);
  const [selectedCocktails, setSelectedCocktails] = useState(new Set());
  const [selectModeBatches, setSelectModeBatches] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState(new Set());

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
    setSelectModeCocktails(false);
    setSelectedCocktails(new Set());
  };

  const openCocktail = (name) => {
    setActiveCocktail(name);
    setSelectModeBatches(false);
    setSelectedBatchIds(new Set());
  };

  const handleSaved = () => {
    setEditing(false);
    setActiveBatch(null);
    setActiveCocktail(null);
    showToast(t.editSaved);
    load();
  };

  // ---- bulk delete: cocktail names (level 1) ----
  const toggleCocktailSelected = (name) => {
    setSelectedCocktails((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };
  const bulkDeleteCocktails = async () => {
    const ids = inCategory.filter((r) => selectedCocktails.has(r.cocktailName)).map((r) => r.id);
    if (ids.length === 0) return;
    if (!window.confirm(t.confirmBulkDelete(selectedCocktails.size))) return;
    setRecipes((r) => r.filter((x) => !ids.includes(x.id)));
    setSelectModeCocktails(false);
    setSelectedCocktails(new Set());
    try {
      await deleteRecipes(ids);
    } catch (e) {
      console.error(e);
      load();
    }
  };

  // ---- bulk delete: component batches within a cocktail (level 2) ----
  const toggleBatchSelected = (id) => {
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const bulkDeleteBatches = async () => {
    const ids = Array.from(selectedBatchIds);
    if (ids.length === 0) return;
    if (!window.confirm(t.confirmBulkDelete(ids.length))) return;
    setRecipes((r) => r.filter((x) => !ids.includes(x.id)));
    setSelectModeBatches(false);
    setSelectedBatchIds(new Set());
    try {
      await deleteRecipes(ids);
    } catch (e) {
      console.error(e);
      load();
    }
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
            {formatDate(activeBatch.date)}
            {session.role === ROLES.HOST && activeBatch.createdBy ? ` · ${activeBatch.createdBy}` : ""}
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

        {canDelete && batchesForCocktail.length > 0 && (
          <div className="bc-select-toolbar">
            {selectModeBatches ? (
              <>
                <span className="bc-muted">{t.selectedCount(selectedBatchIds.size)}</span>
                <div className="bc-select-actions">
                  <button
                    className="bc-nav-btn"
                    onClick={() => {
                      setSelectModeBatches(false);
                      setSelectedBatchIds(new Set());
                    }}
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    className="bc-nav-btn bc-nav-btn--active"
                    onClick={bulkDeleteBatches}
                    disabled={selectedBatchIds.size === 0}
                  >
                    {t.deleteSelectedBtn(selectedBatchIds.size)}
                  </button>
                </div>
              </>
            ) : (
              <button className="bc-nav-btn" onClick={() => setSelectModeBatches(true)}>
                {t.selectMultipleBtn}
              </button>
            )}
          </div>
        )}

        {batchesForCocktail.length === 0 ? (
          <div className="bc-empty">{t.batchListEmpty}</div>
        ) : (
          batchesForCocktail.map((r) => (
            <div
              className={`bc-list-row ${selectModeBatches ? "" : "bc-list-row--clickable"} ${
                selectedBatchIds.has(r.id) ? "bc-list-row--selected" : ""
              }`}
              key={r.id}
              onClick={() => (selectModeBatches ? toggleBatchSelected(r.id) : setActiveBatch(r))}
            >
              <div className="bc-list-main">
                {selectModeBatches && (
                  <input
                    type="checkbox"
                    className="bc-row-checkbox"
                    checked={selectedBatchIds.has(r.id)}
                    onChange={() => toggleBatchSelected(r.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <strong>{r.componentName || COMPONENT_TYPES.find((c) => c.key === r.componentType)?.label || r.componentType}</strong>
                <span className="bc-badge">{COMPONENT_TYPES.find((c) => c.key === r.componentType)?.label}</span>
              </div>
              {!selectModeBatches && <span className="bc-chevron">›</span>}
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

      {canDelete && cocktailNames.length > 0 && (
        <div className="bc-select-toolbar">
          {selectModeCocktails ? (
            <>
              <span className="bc-muted">{t.selectedCount(selectedCocktails.size)}</span>
              <div className="bc-select-actions">
                <button
                  className="bc-nav-btn"
                  onClick={() => {
                    setSelectModeCocktails(false);
                    setSelectedCocktails(new Set());
                  }}
                >
                  {t.cancelBtn}
                </button>
                <button
                  className="bc-nav-btn bc-nav-btn--active"
                  onClick={bulkDeleteCocktails}
                  disabled={selectedCocktails.size === 0}
                >
                  {t.deleteSelectedBtn(selectedCocktails.size)}
                </button>
              </div>
            </>
          ) : (
            <button className="bc-nav-btn" onClick={() => setSelectModeCocktails(true)}>
              {t.selectMultipleBtn}
            </button>
          )}
        </div>
      )}

      {!loaded ? (
        <div className="bc-empty">{t.loadingRecipes}</div>
      ) : cocktailNames.length === 0 ? (
        <div className="bc-empty">{t.cocktailListEmpty}</div>
      ) : (
        cocktailNames.map((name) => {
          const count = inCategory.filter((r) => r.cocktailName === name).length;
          return (
            <div
              className={`bc-list-row ${selectModeCocktails ? "" : "bc-list-row--clickable"} ${
                selectedCocktails.has(name) ? "bc-list-row--selected" : ""
              }`}
              key={name}
              onClick={() => (selectModeCocktails ? toggleCocktailSelected(name) : openCocktail(name))}
            >
              <div className="bc-list-main">
                {selectModeCocktails && (
                  <input
                    type="checkbox"
                    className="bc-row-checkbox"
                    checked={selectedCocktails.has(name)}
                    onChange={() => toggleCocktailSelected(name)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <strong>{name}</strong>
                <span className="bc-badge">{t.batchCount(count)}</span>
              </div>
              {!selectModeCocktails && <span className="bc-chevron">›</span>}
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
