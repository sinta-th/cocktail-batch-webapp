import React, { useState, useEffect, useCallback, useRef } from "react";
import CocktailRecipeForm from "./CocktailRecipeForm";
import { fetchCocktailRecipes, deleteCocktailRecipe, deleteCocktailRecipes } from "../lib/db";
import { CATEGORIES, METHODS, ROLES } from "../lib/constants";
import { formatDate } from "../lib/format";

export default function CocktailRecipes({ session, canCreate, t }) {
  const [recipes, setRecipes] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [mode, setMode] = useState("view"); // 'view' | 'new' | 'edit'
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const canDelete = session.role === ROLES.HOST;

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchCocktailRecipes();
      setRecipes(data);
    } catch (e) {
      console.error(e);
      setError(t.cocktailRecipesLoadError);
    } finally {
      setLoaded(true);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    setRecipes((r) => r.filter((x) => x.id !== id));
    setActiveRecipe(null);
    try {
      await deleteCocktailRecipe(id);
    } catch (e) {
      console.error(e);
      load();
    }
  };

  const handleSaved = () => {
    setMode("view");
    setActiveRecipe(null);
    showToast(t.cocktailRecipeSaved);
    load();
  };

  const inCategory = recipes.filter((r) => r.category === activeCategory);

  const openCategory = (key) => {
    setActiveCategory(key);
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(t.confirmBulkDelete(ids.length))) return;
    setRecipes((r) => r.filter((x) => !ids.includes(x.id)));
    setSelectMode(false);
    setSelectedIds(new Set());
    try {
      await deleteCocktailRecipes(ids);
    } catch (e) {
      console.error(e);
      load();
    }
  };

  // ---- create / edit form ----
  if (mode === "new" || mode === "edit") {
    return (
      <div className="bc-shell">
        <CocktailRecipeForm
          session={session}
          initial={mode === "edit" ? activeRecipe : null}
          t={t}
          onSaved={handleSaved}
          onCancel={() => setMode("view")}
        />
        {toast && <div className="bc-toast">{toast}</div>}
      </div>
    );
  }

  // ---- detail view ----
  if (activeRecipe) {
    const methodLabel = METHODS.find((m) => m.key === activeRecipe.method)?.label || activeRecipe.method;
    return (
      <div className="bc-shell">
        <button
          className="bc-btn bc-btn--ghost bc-btn--full"
          style={{ marginBottom: 16 }}
          onClick={() => setActiveRecipe(null)}
        >
          {t.backToList}
        </button>
        <div className="bc-card">
          {activeRecipe.photoUrl && <img src={activeRecipe.photoUrl} alt="" className="bc-recipe-photo" />}
          <span className="bc-pill">{methodLabel}</span>
          <h2>{activeRecipe.name}</h2>

          <div className="bc-ing-table">
            {activeRecipe.ingredients.map((i, idx) => (
              <div className="bc-ing-row" key={idx}>
                <span>{i.name}</span>
                <strong>
                  {i.amount} {i.unit}
                </strong>
              </div>
            ))}
          </div>

          {activeRecipe.garnish && (
            <p className="bc-card-sub" style={{ marginTop: 14, marginBottom: 0 }}>
              <strong>{t.garnishLabel}:</strong> {activeRecipe.garnish}
            </p>
          )}

          <p className="bc-card-sub" style={{ marginTop: 10, marginBottom: 0 }}>
            {formatDate(activeRecipe.date)}
            {session.role === ROLES.HOST && activeRecipe.createdBy ? ` · ${activeRecipe.createdBy}` : ""}
          </p>

          {(canCreate || canDelete) && (
            <div className="bc-actions" style={{ marginTop: 16 }}>
              {canCreate && (
                <button className="bc-btn bc-btn--ghost" onClick={() => setMode("edit")}>
                  {t.editBtn}
                </button>
              )}
              {canDelete && (
                <button className="bc-btn bc-btn--ghost" onClick={() => remove(activeRecipe.id)}>
                  {t.delete}
                </button>
              )}
            </div>
          )}
        </div>
        {toast && <div className="bc-toast">{toast}</div>}
      </div>
    );
  }

  // ---- list view ----
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

      {canCreate && (
        <button className="bc-add-btn" style={{ marginBottom: 16 }} onClick={() => setMode("new")}>
          {t.addCocktailRecipeBtn}
        </button>
      )}

      {error && <div className="bc-banner">{error}</div>}

      {canDelete && inCategory.length > 0 && (
        <div className="bc-select-toolbar">
          {selectMode ? (
            <>
              <span className="bc-muted">{t.selectedCount(selectedIds.size)}</span>
              <div className="bc-select-actions">
                <button
                  className="bc-nav-btn"
                  onClick={() => {
                    setSelectMode(false);
                    setSelectedIds(new Set());
                  }}
                >
                  {t.cancelBtn}
                </button>
                <button className="bc-nav-btn bc-nav-btn--active" onClick={bulkDelete} disabled={selectedIds.size === 0}>
                  {t.deleteSelectedBtn(selectedIds.size)}
                </button>
              </div>
            </>
          ) : (
            <button className="bc-nav-btn" onClick={() => setSelectMode(true)}>
              {t.selectMultipleBtn}
            </button>
          )}
        </div>
      )}

      {!loaded ? (
        <div className="bc-empty">{t.loadingCocktailRecipes}</div>
      ) : inCategory.length === 0 ? (
        <div className="bc-empty">{t.cocktailRecipeListEmpty}</div>
      ) : (
        inCategory.map((r) => (
          <div
            className={`bc-list-row ${selectMode ? "" : "bc-list-row--clickable"} ${
              selectedIds.has(r.id) ? "bc-list-row--selected" : ""
            }`}
            key={r.id}
            onClick={() => (selectMode ? toggleSelected(r.id) : setActiveRecipe(r))}
          >
            <div className="bc-list-main">
              {selectMode && (
                <input
                  type="checkbox"
                  className="bc-row-checkbox"
                  checked={selectedIds.has(r.id)}
                  onChange={() => toggleSelected(r.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <strong>{r.name}</strong>
              <span className="bc-badge">{METHODS.find((m) => m.key === r.method)?.label || r.method}</span>
            </div>
            {!selectMode && <span className="bc-chevron">›</span>}
          </div>
        ))
      )}
      {toast && <div className="bc-toast">{toast}</div>}
    </div>
  );
}
